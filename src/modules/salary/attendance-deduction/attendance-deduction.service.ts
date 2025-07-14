import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceDeduction } from './entities/attendance-deduction.entity';
import { CreateAttendanceDeductionDto } from './dto/create-attendance-deduction.dto';
import { UpdateAttendanceDeductionDto } from './dto/update-attendance-deduction.dto';
import { QueryAttendanceDeductionDto } from './dto/query-attendance-deduction.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import { spawn } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class AttendanceDeductionService {
  constructor(
    @InjectRepository(AttendanceDeduction)
    private readonly attendanceDeductionRepository: Repository<AttendanceDeduction>,
  ) {}

  async create(createAttendanceDeductionDto: CreateAttendanceDeductionDto): Promise<AttendanceDeduction> {
    const attendanceDeduction = this.attendanceDeductionRepository.create(createAttendanceDeductionDto);
    return this.attendanceDeductionRepository.save(attendanceDeduction);
  }

  async importData(file: Express.Multer.File) {
    console.log('开始导入数据，文件信息:', {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding,
      buffer: `Buffer[${file.buffer.length} bytes]`
    });

    return new Promise(async (resolve, reject) => {
      try {
        // 创建临时文件
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${file.originalname}`);
        
        console.log('创建临时文件:', tempFilePath);
        
        // 写入上传的文件数据到临时文件
        await fs.promises.writeFile(tempFilePath, file.buffer);
        
        // 当前项目根目录
        const rootDir = process.cwd();
        
        // Python脚本路径
        const scriptPath = join(rootDir, 'src/modules/salary/attendance-deduction/utils/import_deduction.py');
        
        console.log('Python脚本路径:', scriptPath);
        console.log('临时文件路径:', tempFilePath);
        
        // 创建子进程运行Python脚本
        const pythonProcess = spawn('python3', [scriptPath, '--file', tempFilePath], {
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
          
          // 如果没有从输出中解析到结果JSON，则创建一个默认的
          if (!resultJson) {
            if (code === 0) {
              resultJson = {
                success: true,
                message: '文件导入成功，但未返回详细结果',
                imported_count: 0,
                failed_count: 0
              };
            } else {
              resultJson = {
                success: false,
                message: '文件导入失败',
                error_message: errorString || '未知错误',
                imported_count: 0,
                failed_count: 0
              };
            }
          }
          
          resolve({
            success: resultJson.success,
            message: resultJson.success ? `成功导入 ${resultJson.imported_count} 条记录` : resultJson.error_message || '导入失败',
            importedCount: resultJson.imported_count || 0,
            failedCount: resultJson.failed_count || 0,
            failedRecords: resultJson.failed_records || []
          });
        });
        
        // 处理错误
        pythonProcess.on('error', async (err) => {
          console.error('启动Python进程失败:', err);
          
          // 清理临时文件
          try {
            await fs.promises.unlink(tempFilePath);
            console.log('临时文件已删除');
          } catch (delErr) {
            console.error('删除临时文件失败:', delErr);
          }
          
          reject({
            success: false,
            error: '启动导入进程失败',
            details: err.message
          });
        });
        
      } catch (error) {
        console.error('导入数据异常:', error);
        reject({
          success: false,
          error: '导入数据异常',
          details: error.message
        });
      }
    });
  }

  async findAll(query: QueryAttendanceDeductionDto) {
    // 确保分页参数是有效的数字
    let { 
      page = 1, 
      pageSize = 10, 
      name,
      yearMonth,
      startDate,
      endDate
    } = query;
    
    // 修复: safePaginationParams只返回page和pageSize，所以我们需要自行计算skip和take
    const paginationParams = safePaginationParams(page, pageSize);
    page = paginationParams.page;
    pageSize = paginationParams.pageSize;
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    
    // 构建查询条件
    const queryBuilder = this.attendanceDeductionRepository.createQueryBuilder('deduction');
    
    // 应用过滤条件
    if (name) {
      queryBuilder.andWhere('deduction.name LIKE :name', { name: `%${name}%` });
    }
    
    // 处理日期筛选
    if (yearMonth) {
      // 确保yearMonth是Date对象
      const date = safeDateParam(yearMonth);
      if (date instanceof Date) {
        // 获取年月的第一天和最后一天
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        queryBuilder.andWhere('deduction.yearMonth BETWEEN :firstDay AND :lastDay', {
          firstDay,
          lastDay
        });
      }
    } else if (startDate || endDate) {
      // 处理日期范围筛选
      if (startDate) {
        const start = safeDateParam(startDate);
        if (start instanceof Date) {
          queryBuilder.andWhere('deduction.yearMonth >= :startDate', { startDate: start });
        }
      }
      
      if (endDate) {
        const end = safeDateParam(endDate);
        if (end instanceof Date) {
          queryBuilder.andWhere('deduction.yearMonth <= :endDate', { endDate: end });
        }
      }
    }
    
    // 获取总数
    const total = await queryBuilder.getCount();
    
    // 获取分页数据
    const items = await queryBuilder
      .orderBy('deduction.yearMonth', 'DESC')
      .addOrderBy('deduction.name', 'ASC')
      .skip(skip)
      .take(take)
      .getMany();
    
    // 返回分页结果
    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async findOne(id: number): Promise<AttendanceDeduction> {
    const record = await this.attendanceDeductionRepository.findOne({
      where: { id }
    });
    
    if (!record) {
      throw new Error(`考勤扣款记录(ID: ${id})不存在`);
    }
    
    return record;
  }

  async update(id: number, updateAttendanceDeductionDto: UpdateAttendanceDeductionDto): Promise<AttendanceDeduction> {
    // 确保记录存在
    const record = await this.findOne(id);
    
    // 更新记录
    const updatedRecord = Object.assign(record, updateAttendanceDeductionDto);
    return this.attendanceDeductionRepository.save(updatedRecord);
  }

  async remove(id: number): Promise<void> {
    // 确保记录存在
    await this.findOne(id);
    
    // 删除记录
    await this.attendanceDeductionRepository.delete(id);
  }
} 