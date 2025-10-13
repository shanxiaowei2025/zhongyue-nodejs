import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubsidySummary } from './entities/subsidy-summary.entity';
import { CreateSubsidySummaryDto } from './dto/create-subsidy-summary.dto';
import { UpdateSubsidySummaryDto } from './dto/update-subsidy-summary.dto';
import { QuerySubsidySummaryDto } from './dto/query-subsidy-summary.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import { spawn } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class SubsidySummaryService {
  constructor(
    @InjectRepository(SubsidySummary)
    private readonly subsidySummaryRepository: Repository<SubsidySummary>,
  ) {}

  async create(
    createSubsidySummaryDto: CreateSubsidySummaryDto,
  ): Promise<SubsidySummary> {
    // 自动计算补贴合计
    createSubsidySummaryDto.totalSubsidy = this.calculateTotalSubsidy(
      createSubsidySummaryDto,
    );

    const subsidySummary = this.subsidySummaryRepository.create(
      createSubsidySummaryDto,
    );
    return this.subsidySummaryRepository.save(subsidySummary);
  }

  async importData(file: Express.Multer.File) {
    console.log('开始导入数据，文件信息:', {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding,
      buffer: `Buffer[${file.buffer.length} bytes]`,
    });

    return new Promise(async (resolve, reject) => {
      try {
        // 创建临时文件
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(
          tempDir,
          `upload_${Date.now()}_${file.originalname}`,
        );

        console.log('创建临时文件:', tempFilePath);

        // 写入上传的文件数据到临时文件
        await fs.promises.writeFile(tempFilePath, file.buffer);

        // 当前项目根目录
        const rootDir = process.cwd();

        // Python脚本路径
        const scriptPath = join(
          rootDir,
          'src/modules/salary/subsidy-summary/utils/import_subsidy.py',
        );

        console.log('Python脚本路径:', scriptPath);
        console.log('临时文件路径:', tempFilePath);

        // 创建子进程运行Python脚本
        const pythonProcess = spawn(
          'python3',
          [scriptPath, '--file', tempFilePath, '--overwrite'],
          {
            env: {
              ...process.env,
              DB_HOST: process.env.DB_HOST || 'localhost',
              DB_PORT: process.env.DB_PORT || '3306',
              DB_DATABASE: process.env.DB_DATABASE || 'zhongyue',
              DB_USERNAME: process.env.DB_USERNAME || 'root',
              DB_PASSWORD: process.env.DB_PASSWORD || 'password',
            },
          },
        );

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
            // 如果有解析到的错误信息，使用它
            if (resultJson && resultJson.error_type === 'invalid_date_range') {
              return reject({
                success: false,
                error: resultJson.error_message || '只能导入上个月数据',
                details: resultJson,
                exitCode: code,
              });
            }
            
            console.error('Python脚本执行失败:', errorString);
            return reject({
              success: false,
              error: '导入失败',
              details: errorString || '未知错误',
              exitCode: code,
            });
          }

          // 如果没有从输出中解析到结果JSON，则创建一个默认的
          if (!resultJson) {
            if (code === 0) {
              resultJson = {
                success: true,
                message: '文件导入成功，但未返回详细结果',
                imported_count: 0,
                failed_count: 0,
              };
            } else {
              resultJson = {
                success: false,
                message: '文件导入失败',
                error_message: errorString || '未知错误',
                imported_count: 0,
                failed_count: 0,
              };
            }
          }

          resolve({
            success: resultJson.success,
            message: resultJson.success
              ? `成功导入 ${resultJson.imported_count} 条记录`
              : resultJson.error_message || '导入失败',
            importedCount: resultJson.imported_count || 0,
            failedCount: resultJson.failed_count || 0,
            failedRecords: resultJson.failed_records || [],
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
            details: err.message,
          });
        });
      } catch (error) {
        console.error('导入数据异常:', error);
        reject({
          success: false,
          error: '导入数据异常',
          details: error.message,
        });
      }
    });
  }

  async findAll(query: QuerySubsidySummaryDto) {
    // 打印原始查询参数
    console.log('原始查询参数:', JSON.stringify(query));

    // 确保分页参数是有效的数字
    let {
      page = 1,
      pageSize = 10,
      name,
      department,
      position,
      yearMonth,
      startDate,
      endDate,
    } = query;

    // 使用安全的分页参数处理函数
    const { page: safePage, pageSize: safePageSize } = safePaginationParams(
      page,
      pageSize,
    );
    page = safePage;
    pageSize = safePageSize;

    const queryBuilder =
      this.subsidySummaryRepository.createQueryBuilder('subsidySummary');

    // 字符串字段模糊查询
    if (name) {
      queryBuilder.andWhere('subsidySummary.name LIKE :name', {
        name: `%${name}%`,
      });
    }

    if (department) {
      queryBuilder.andWhere('subsidySummary.department LIKE :department', {
        department: `%${department}%`,
      });
    }

    if (position) {
      queryBuilder.andWhere('subsidySummary.position LIKE :position', {
        position: `%${position}%`,
      });
    }

    // 处理日期参数，避免NaN值
    try {
      // 安全处理yearMonth参数 - 支持模糊查询
      const safeYearMonth = safeDateParam(yearMonth);
      if (safeYearMonth) {
        // 将日期转换为字符串格式 YYYY-MM-DD
        const yearMonthStr =
          typeof safeYearMonth === 'string'
            ? safeYearMonth
            : safeYearMonth.toISOString().split('T')[0];
        // 提取年月部分 YYYY-MM
        const yearMonthPart = yearMonthStr.substring(0, 7);

        // 使用DATE_FORMAT函数进行模糊查询
        queryBuilder.andWhere(
          'DATE_FORMAT(subsidySummary.yearMonth, "%Y-%m") LIKE :yearMonth',
          { yearMonth: `%${yearMonthPart}%` },
        );
        console.log('使用年月模糊查询:', yearMonthPart);
      }

      // 安全处理startDate和endDate参数
      const safeStartDate = safeDateParam(startDate);
      const safeEndDate = safeDateParam(endDate);

      if (safeStartDate && safeEndDate) {
        queryBuilder.andWhere(
          'subsidySummary.yearMonth BETWEEN :startDate AND :endDate',
          {
            startDate: safeStartDate,
            endDate: safeEndDate,
          },
        );
        console.log('使用日期范围:', safeStartDate, '至', safeEndDate);
      }
    } catch (error) {
      console.error('日期参数处理错误:', error);
    }

    // 打印生成的SQL和参数
    const [query_sql, parameters] = queryBuilder.getQueryAndParameters();
    console.log('生成的SQL:', query_sql);
    console.log('SQL参数:', parameters);

    // 获取数据时使用try-catch包装，以防止排序或分页出现NaN问题
    let total = 0;
    let data = [];

    try {
      total = await queryBuilder.getCount();

      data = await queryBuilder
        .orderBy('subsidySummary.yearMonth', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();
    } catch (error) {
      console.error('获取数据出错:', error);
    }

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<SubsidySummary> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`无效的ID值: ${id}, 转换后: ${safeId}`);
      return null;
    }
    return this.subsidySummaryRepository.findOne({ where: { id: safeId } });
  }

  async update(
    id: number,
    updateSubsidySummaryDto: UpdateSubsidySummaryDto,
  ): Promise<SubsidySummary> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`更新时无效的ID值: ${id}, 转换后: ${safeId}`);
      return null;
    }

    // 如果更新了任何补贴字段，重新计算合计
    if (
      updateSubsidySummaryDto.departmentHeadSubsidy !== undefined ||
      updateSubsidySummaryDto.positionAllowance !== undefined ||
      updateSubsidySummaryDto.oilSubsidy !== undefined ||
      updateSubsidySummaryDto.mealSubsidy !== undefined
    ) {
      // 先获取现有数据
      const existingData = await this.findOne(safeId);
      if (existingData) {
        // 合并现有数据和更新数据
        const mergedData = {
          departmentHeadSubsidy:
            updateSubsidySummaryDto.departmentHeadSubsidy ??
            existingData.departmentHeadSubsidy,
          positionAllowance:
            updateSubsidySummaryDto.positionAllowance ??
            existingData.positionAllowance,
          oilSubsidy:
            updateSubsidySummaryDto.oilSubsidy ?? existingData.oilSubsidy,
          mealSubsidy:
            updateSubsidySummaryDto.mealSubsidy ?? existingData.mealSubsidy,
        };
        // 计算新的合计值
        updateSubsidySummaryDto.totalSubsidy =
          this.calculateTotalSubsidy(mergedData);
      }
    }

    await this.subsidySummaryRepository.update(safeId, updateSubsidySummaryDto);
    return this.findOne(safeId);
  }

  async remove(id: number): Promise<void> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`删除时无效的ID值: ${id}, 转换后: ${safeId}`);
      return;
    }
    await this.subsidySummaryRepository.delete(safeId);
  }

  /**
   * 计算补贴合计
   */
  private calculateTotalSubsidy(data: {
    departmentHeadSubsidy?: number | string;
    positionAllowance?: number | string;
    oilSubsidy?: number | string;
    mealSubsidy?: number | string;
  }): number {
    // 确保所有值都转换为数字类型
    const departmentHeadSubsidy = data.departmentHeadSubsidy
      ? Number(data.departmentHeadSubsidy)
      : 0;
    const positionAllowance = data.positionAllowance
      ? Number(data.positionAllowance)
      : 0;
    const oilSubsidy = data.oilSubsidy ? Number(data.oilSubsidy) : 0;
    const mealSubsidy = data.mealSubsidy ? Number(data.mealSubsidy) : 0;

    // 检查是否有任何值不是有效数字
    if (
      isNaN(departmentHeadSubsidy) ||
      isNaN(positionAllowance) ||
      isNaN(oilSubsidy) ||
      isNaN(mealSubsidy)
    ) {
      console.error('计算补贴合计时遇到无效数值:', {
        departmentHeadSubsidy: data.departmentHeadSubsidy,
        positionAllowance: data.positionAllowance,
        oilSubsidy: data.oilSubsidy,
        mealSubsidy: data.mealSubsidy,
      });
      return 0; // 返回默认值
    }

    // 计算总和并保留两位小数
    const total =
      departmentHeadSubsidy + positionAllowance + oilSubsidy + mealSubsidy;
    return Number(total.toFixed(2));
  }
}
