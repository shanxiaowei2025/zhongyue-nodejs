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

  async create(
    createAttendanceDeductionDto: CreateAttendanceDeductionDto,
  ): Promise<AttendanceDeduction> {
    const attendanceDeduction = this.attendanceDeductionRepository.create(
      createAttendanceDeductionDto,
    );
    return this.attendanceDeductionRepository.save(attendanceDeduction);
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
          'src/modules/salary/attendance-deduction/utils/import_deduction.py',
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
          const output = data.toString();
          dataString += output;
          console.log('Python输出:', output);

          // 尝试解析JSON结果
          const importResultMatch = output.match(
            /IMPORT_RESULT_JSON:\s*({.*})/,
          );
          if (importResultMatch) {
            try {
              resultJson = JSON.parse(importResultMatch[1]);
              console.log('解析到导入结果:', resultJson);
            } catch (e) {
              console.error('解析导入结果JSON失败:', e);
            }
          }

          // 尝试解析错误信息JSON
          const errorInfoMatch = output.match(/ERROR_INFO_JSON:\s*({.*})/);
          if (errorInfoMatch) {
            try {
              const errorInfo = JSON.parse(errorInfoMatch[1]);
              console.log('解析到错误信息:', errorInfo);
              
              // 处理不同类型的错误
              if (errorInfo.error === 'invalid_date_range') {
                // 时间验证错误
                console.log('时间验证失败:', errorInfo.details);
                console.log('无效记录:', JSON.stringify(errorInfo.invalidRecords, null, 2));
                
                resultJson = {
                  success: false,
                  error: '时间验证失败',
                  details: errorInfo.message || '只能导入上个月数据',
                  error_type: 'invalid_date_range',
                  invalidRecords: errorInfo.invalidRecords || [],
                  importedCount: 0,
                  failedCount: 0,
                  failedRecords: [],
                };
              } else if (errorInfo.error_type === 'name_mismatch') {
                // 姓名对比错误
                const nameMismatchDetails = errorInfo.name_mismatch_details || {};
                const employeesNotRecorded = nameMismatchDetails.employees_not_recorded || [];
                const employeesNoAttendance = nameMismatchDetails.employees_no_attendance || [];
                
                let detailedMessage = errorInfo.error_message;
                if (employeesNotRecorded.length > 0) {
                  detailedMessage += `\n未录入的员工: ${employeesNotRecorded.join(', ')}`;
                }
                if (employeesNoAttendance.length > 0) {
                  detailedMessage += `\n缺少考勤信息的员工: ${employeesNoAttendance.join(', ')}`;
                }
                
                resultJson = {
                  success: false,
                  error: '员工姓名对比失败',
                  details: detailedMessage,
                  error_type: 'name_mismatch',
                  name_mismatch_details: nameMismatchDetails,
                  importedCount: 0,
                  failedCount: 0,
                  failedRecords: [],
                };
              } else {
                // 其他类型的错误
                resultJson = {
                  success: false,
                  error: '导入失败',
                  details: errorInfo.error_message,
                  error_type: errorInfo.error_type,
                  importedCount: 0,
                  failedCount: 0,
                  failedRecords: errorInfo.failed_records || [],
                };
              }
            } catch (e) {
              console.error('解析错误信息JSON失败:', e);
            }
          }
        });

        // 收集标准错误
        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          errorString += error;
          console.error('Python错误:', error);
        });

        // 进程结束处理
        pythonProcess.on('close', async (code) => {
          console.log(`Python进程结束，退出码: ${code}`);

          try {
            // 清理临时文件
            await fs.promises.unlink(tempFilePath);
            console.log('临时文件已删除:', tempFilePath);
          } catch (unlinkError) {
            console.warn('删除临时文件失败:', unlinkError);
          }

          if (code === 0) {
            // 成功执行
            if (resultJson) {
              console.log('导入成功，结果:', resultJson);
              
              // 构建响应消息
              let message = `成功导入 ${resultJson.imported_count} 条记录`;
              if (resultJson.warning) {
                message += `，${resultJson.warning}`;
              }
              
              resolve({
                success: true,
                message: message,
                importedCount: resultJson.imported_count,
                failedCount: resultJson.failed_count,
                failedRecords: resultJson.failed_records,
                warning: resultJson.warning,
                name_mismatch_details: resultJson.name_mismatch_details,
              });
            } else {
              console.log('导入完成但未获取到结果JSON');
              resolve({
                success: true,
                message: '导入完成',
                importedCount: 0,
                failedCount: 0,
                failedRecords: [],
              });
            }
          } else {
            // 执行失败
            console.error('Python脚本执行失败');
            console.error('标准输出:', dataString);
            console.error('标准错误:', errorString);

            if (resultJson) {
              // 有具体的错误信息
              reject({
                success: false,
                error: resultJson.error || '导入失败',
                details: resultJson.details || errorString || '未知错误',
                error_type: resultJson.error_type,
                name_mismatch_details: resultJson.name_mismatch_details,
                importedCount: resultJson.importedCount || 0,
                failedCount: resultJson.failedCount || 0,
                failedRecords: resultJson.failedRecords || [],
              });
            } else {
              // 通用错误处理
              reject({
                success: false,
                error: '导入失败',
                details: errorString || '未知错误',
                importedCount: 0,
                failedCount: 0,
                failedRecords: [],
              });
            }
          }
        });

        // 处理进程错误
        pythonProcess.on('error', (error) => {
          console.error('Python进程启动失败:', error);
          reject({
            success: false,
            error: '导入失败',
            details: `进程启动失败: ${error.message}`,
            importedCount: 0,
            failedCount: 0,
            failedRecords: [],
          });
        });
      } catch (error) {
        console.error('导入数据异常:', error);
        reject({
          success: false,
          error: '导入失败',
          details: error.message,
          importedCount: 0,
          failedCount: 0,
          failedRecords: [],
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
      endDate,
    } = query;

    // 修复: safePaginationParams只返回page和pageSize，所以我们需要自行计算skip和take
    const paginationParams = safePaginationParams(page, pageSize);
    page = paginationParams.page;
    pageSize = paginationParams.pageSize;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询条件
    const queryBuilder =
      this.attendanceDeductionRepository.createQueryBuilder('deduction');

    // 应用过滤条件
    if (name) {
      queryBuilder.andWhere('deduction.name LIKE :name', { name: `%${name}%` });
    }

    // 处理日期筛选
    if (yearMonth) {
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
          'DATE_FORMAT(deduction.yearMonth, "%Y-%m") LIKE :yearMonth',
          { yearMonth: `%${yearMonthPart}%` },
        );
        console.log('使用年月模糊查询:', yearMonthPart);
      }
    } else if (startDate || endDate) {
      // 处理日期范围筛选
      if (startDate) {
        const start = safeDateParam(startDate);
        if (start instanceof Date) {
          queryBuilder.andWhere('deduction.yearMonth >= :startDate', {
            startDate: start,
          });
        }
      }

      if (endDate) {
        const end = safeDateParam(endDate);
        if (end instanceof Date) {
          queryBuilder.andWhere('deduction.yearMonth <= :endDate', {
            endDate: end,
          });
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
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number): Promise<AttendanceDeduction> {
    const record = await this.attendanceDeductionRepository.findOne({
      where: { id },
    });

    if (!record) {
      throw new Error(`考勤扣款记录(ID: ${id})不存在`);
    }

    return record;
  }

  async update(
    id: number,
    updateAttendanceDeductionDto: UpdateAttendanceDeductionDto,
  ): Promise<AttendanceDeduction> {
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
