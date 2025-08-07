import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Deposit } from './entities/deposit.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { QueryDepositDto } from './dto/query-deposit.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
  ) {}

  /**
   * 创建保证金记录
   */
  async create(createDepositDto: CreateDepositDto): Promise<Deposit> {
    try {
      // 验证和转换日期
      let deductionDate: Date;
      
      if (typeof createDepositDto.deductionDate === 'string') {
        // 验证是否是YYYY-MM-DD格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(createDepositDto.deductionDate)) {
          throw new BadRequestException('扣除日期必须是有效的YYYY-MM-DD格式');
        }
        
        // 创建一个新的Date对象，使用UTC避免时区问题
        const [year, month, day] = createDepositDto.deductionDate.split('-').map(Number);
        deductionDate = new Date(Date.UTC(year, month - 1, day));
        
        if (isNaN(deductionDate.getTime())) {
          throw new BadRequestException('无效的日期值');
        }
      } else {
        throw new BadRequestException('扣除日期不是有效的字符串格式');
      }
      
      // 创建实体对象
      const deposit = new Deposit();
      deposit.name = createDepositDto.name;
      deposit.amount = createDepositDto.amount;
      deposit.deductionDate = deductionDate;
      deposit.remark = createDepositDto.remark || '';
      
      console.log('准备创建保证金记录:', JSON.stringify({
        name: deposit.name,
        amount: deposit.amount,
        deductionDate: deposit.deductionDate.toISOString(),
        remark: deposit.remark
      }));
      
      // 保存到数据库
      return this.depositRepository.save(deposit);
    } catch (error) {
      console.error('创建保证金记录失败:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`创建保证金记录失败: ${error.message}`);
    }
  }

  /**
   * 从Excel文件导入保证金记录
   */
  async importDataFromFile(file: Express.Multer.File): Promise<any> {
    console.log('开始从文件导入保证金数据，文件信息:', {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding,
      buffer: `Buffer[${file.buffer?.length || 0} bytes]`
    });

    return new Promise(async (resolve, reject) => {
      try {
        // 创建临时文件
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `deposit_upload_${Date.now()}_${file.originalname}`);
        
        console.log('创建临时文件:', tempFilePath);
        
        // 写入上传的文件数据到临时文件
        await fs.promises.writeFile(tempFilePath, file.buffer);
        
        // 当前项目根目录
        const rootDir = process.cwd();
        
        // Python脚本路径
        const scriptPath = path.join(rootDir, 'src/modules/salary/deposit/utils/import_deposit.py');
        
        console.log('Python脚本路径:', scriptPath);
        console.log('临时文件路径:', tempFilePath);
        
        // 创建子进程运行Python脚本，添加覆盖模式参数
        const pythonProcess = spawn('python3', [scriptPath, '--file', tempFilePath, '--overwrite'], {
          env: {
            ...process.env,
            DB_HOST: process.env.DB_HOST || 'localhost',
            DB_PORT: process.env.DB_PORT || '3306',
            DB_DATABASE: process.env.DB_DATABASE || 'zhongyue',
            DB_USERNAME: process.env.DB_USERNAME || 'root',
            DB_PASSWORD: process.env.DB_PASSWORD || 'password',
          }
        });
        
        let dataString = '';
        let errorString = '';
        let resultJson = null;
        
        // 收集标准输出
        pythonProcess.stdout.on('data', (data) => {
          dataString += data.toString();
          console.log('Python输出:', data.toString());
          
          // 尝试提取JSON结果
          const resultMatch = dataString.match(/IMPORT_RESULT_JSON: (\{.*\})/s);
          if (resultMatch && resultMatch[1]) {
            try {
              resultJson = JSON.parse(resultMatch[1]);
              console.log('解析到导入结果:', resultJson);
            } catch (e) {
              console.error('解析JSON结果失败:', e);
            }
          }
          
          // 尝试提取错误信息
          const errorMatch = dataString.match(/ERROR_INFO_JSON: (\{.*\})/s);
          if (errorMatch && errorMatch[1]) {
            try {
              resultJson = JSON.parse(errorMatch[1]);
              console.log('解析到错误信息:', resultJson);
            } catch (e) {
              console.error('解析JSON错误信息失败:', e);
            }
          }
        });
        
        // 收集错误输出
        pythonProcess.stderr.on('data', (data) => {
          errorString += data.toString();
          console.error('Python错误:', data.toString());
        });
        
        // 进程结束
        pythonProcess.on('close', async (code) => {
          console.log(`Python进程退出，退出码: ${code}`);
          
          // 清理临时文件
          try {
            await fs.promises.unlink(tempFilePath);
            console.log('临时文件已删除');
          } catch (err) {
            console.error('删除临时文件失败:', err);
          }
          
          if (code !== 0) {
            console.error('Python脚本执行失败:', errorString);
            return reject({
              success: false,
              error: '导入失败',
              details: errorString || '未知错误',
              exitCode: code
            });
          }
          
          if (resultJson) {
            // 如果有解析到结果，返回结果
            return resolve(resultJson);
          } else {
            // 没有解析到结果，尝试解析最后的输出
            try {
              // 尝试在整个输出中找到可能的JSON
              const jsonMatch = dataString.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const possibleJson = jsonMatch[0];
                const parsedResult = JSON.parse(possibleJson);
                return resolve(parsedResult);
              }
              
              // 如果没找到JSON，返回一个基本结果
              return resolve({
                success: true,
                message: '导入完成，但未能获取详细结果',
                raw: dataString
              });
            } catch (e) {
              console.error('解析导入结果失败:', e);
              return resolve({
                success: true,
                message: '导入完成，但无法解析结果',
                raw: dataString
              });
            }
          }
        });
      } catch (error) {
        console.error('导入过程中发生错误:', error);
        reject({
          success: false,
          error: '导入过程发生错误',
          details: error.message
        });
      }
    });
  }

  /**
   * 查询保证金记录列表
   */
  async findAll(query: QueryDepositDto) {
    // 确保分页参数是有效的数字
    let { page = 1, pageSize = 10, name, startDate, endDate } = query;
    
    // 使用安全的分页参数处理函数
    const { page: safePage, pageSize: safePageSize } = safePaginationParams(page, pageSize);
    page = safePage;
    pageSize = safePageSize;
    
    // 构建查询条件
    const where: any = {};
    
    if (name) {
      where.name = Like(`%${name}%`);
    }
    
    // 处理日期查询
    if (startDate && endDate) {
      const safeStartDate = safeDateParam(startDate);
      const safeEndDate = safeDateParam(endDate);
      
      if (safeStartDate && safeEndDate) {
        where.deductionDate = Between(safeStartDate, safeEndDate);
      }
    } else if (startDate) {
      const safeStartDate = safeDateParam(startDate);
      if (safeStartDate) {
        where.deductionDate = Between(safeStartDate, new Date());
      }
    } else if (endDate) {
      const safeEndDate = safeDateParam(endDate);
      if (safeEndDate) {
        where.deductionDate = Between(new Date('2000-01-01'), safeEndDate);
      }
    }
    
    // 执行查询
    const [data, total] = await this.depositRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { deductionDate: 'DESC' }
    });
    
    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 查询单个保证金记录
   */
  async findOne(id: number): Promise<Deposit> {
    const deposit = await this.depositRepository.findOne({ where: { id } });
    
    if (!deposit) {
      throw new NotFoundException(`ID为${id}的保证金记录不存在`);
    }
    
    return deposit;
  }

  /**
   * 更新保证金记录
   */
  async update(id: number, updateDepositDto: UpdateDepositDto): Promise<Deposit> {
    const deposit = await this.findOne(id);
    
    await this.depositRepository.update(id, updateDepositDto);
    return this.findOne(id);
  }

  /**
   * 删除保证金记录
   */
  async remove(id: number): Promise<void> {
    const deposit = await this.findOne(id);
    await this.depositRepository.remove(deposit);
  }
} 