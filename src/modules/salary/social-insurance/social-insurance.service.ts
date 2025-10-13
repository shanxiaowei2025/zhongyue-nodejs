import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialInsurance } from './entities/social-insurance.entity';
import { CreateSocialInsuranceDto } from './dto/create-social-insurance.dto';
import { UpdateSocialInsuranceDto } from './dto/update-social-insurance.dto';
import { QuerySocialInsuranceDto } from './dto/query-social-insurance.dto';
import { safeDateParam, safePaginationParams } from 'src/common/utils';
import { spawn } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class SocialInsuranceService {
  constructor(
    @InjectRepository(SocialInsurance)
    private readonly socialInsuranceRepository: Repository<SocialInsurance>,
  ) {}

  async create(
    createSocialInsuranceDto: CreateSocialInsuranceDto,
  ): Promise<SocialInsurance> {
    console.log(
      '创建社保信息，原始数据:',
      JSON.stringify(createSocialInsuranceDto),
    );

    // 自动计算个人合计、公司合计和总合计
    const calculatedDto = this.calculateTotals(createSocialInsuranceDto);

    // 确保其他非计算字段被保留
    const completeDto = {
      ...createSocialInsuranceDto, // 保留原始DTO中的所有字段
      ...calculatedDto, // 覆盖/添加计算的字段
    };

    console.log('最终保存的数据:', JSON.stringify(completeDto));

    const socialInsurance = this.socialInsuranceRepository.create(completeDto);
    return this.socialInsuranceRepository.save(socialInsurance);
  }

  async importData(file: Express.Multer.File) {
    console.log('开始导入社保信息数据，文件信息:', {
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
          'src/modules/salary/social-insurance/utils/import_insurance.py',
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
            console.error('Python脚本执行失败:', errorString);
            
            // 如果有解析到的错误信息，使用它
            if (resultJson && resultJson.error_type === 'invalid_date_range') {
              return reject({
                success: false,
                error: resultJson.error_message || '只能导入上个月数据，导入失败。',
                details: resultJson,
                exitCode: code,
              });
            }
            
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

  async findAll(query: QuerySocialInsuranceDto) {
    console.log('社保信息查询参数:', JSON.stringify(query));

    // 确保分页参数是有效的数字
    let {
      page = 1,
      pageSize = 10,
      name,
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
      this.socialInsuranceRepository.createQueryBuilder('socialInsurance');

    // 姓名模糊查询
    if (name) {
      queryBuilder.andWhere('socialInsurance.name LIKE :name', {
        name: `%${name}%`,
      });
      console.log('使用姓名模糊查询:', name);
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
          'DATE_FORMAT(socialInsurance.yearMonth, "%Y-%m") LIKE :yearMonth',
          { yearMonth: `%${yearMonthPart}%` },
        );
        console.log('使用年月模糊查询:', yearMonthPart);
      }

      // 安全处理startDate和endDate参数
      const safeStartDate = safeDateParam(startDate);
      const safeEndDate = safeDateParam(endDate);

      if (safeStartDate && safeEndDate) {
        queryBuilder.andWhere(
          'socialInsurance.yearMonth BETWEEN :startDate AND :endDate',
          {
            startDate: safeStartDate,
            endDate: safeEndDate,
          },
        );
        console.log('使用日期范围:', safeStartDate, '至', safeEndDate);
      } else if (safeStartDate) {
        // 只提供了开始日期，查询大于等于该日期的记录
        queryBuilder.andWhere('socialInsurance.yearMonth >= :startDate', {
          startDate: safeStartDate,
        });
        console.log('使用开始日期:', safeStartDate);
      } else if (safeEndDate) {
        // 只提供了结束日期，查询小于等于该日期的记录
        queryBuilder.andWhere('socialInsurance.yearMonth <= :endDate', {
          endDate: safeEndDate,
        });
        console.log('使用结束日期:', safeEndDate);
      }
    } catch (error) {
      console.error('社保信息日期参数处理错误:', error);
    }

    // 打印生成的SQL和参数
    const [query_sql, parameters] = queryBuilder.getQueryAndParameters();
    console.log('社保信息生成的SQL:', query_sql);
    console.log('社保信息SQL参数:', parameters);

    // 获取数据时使用try-catch包装，以防止排序或分页出现NaN问题
    let total = 0;
    let data = [];

    try {
      total = await queryBuilder.getCount();

      data = await queryBuilder
        .orderBy('socialInsurance.yearMonth', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getMany();
    } catch (error) {
      console.error('获取社保信息数据出错:', error);
    }

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<SocialInsurance> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`无效的ID值: ${id}, 转换后: ${safeId}`);
      return null;
    }
    return this.socialInsuranceRepository.findOne({ where: { id: safeId } });
  }

  async update(
    id: number,
    updateSocialInsuranceDto: UpdateSocialInsuranceDto,
  ): Promise<SocialInsurance> {
    console.log(
      `更新社保信息ID:${id}，原始数据:`,
      JSON.stringify(updateSocialInsuranceDto),
    );

    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`更新时无效的ID值: ${id}, 转换后: ${safeId}`);
      return null;
    }

    // 先获取现有数据
    const existingData = await this.findOne(safeId);
    if (!existingData) {
      console.error(`更新的记录不存在，ID: ${safeId}`);
      return null;
    }

    // 检查是否更新了金额字段
    const needRecalculate =
      updateSocialInsuranceDto.personalMedical !== undefined ||
      updateSocialInsuranceDto.personalPension !== undefined ||
      updateSocialInsuranceDto.personalUnemployment !== undefined ||
      updateSocialInsuranceDto.companyMedical !== undefined ||
      updateSocialInsuranceDto.companyPension !== undefined ||
      updateSocialInsuranceDto.companyUnemployment !== undefined ||
      updateSocialInsuranceDto.companyInjury !== undefined;

    // 如果需要重新计算合计
    if (needRecalculate) {
      // 合并现有数据和更新数据
      const mergedData = {
        personalMedical:
          updateSocialInsuranceDto.personalMedical ??
          existingData.personalMedical,
        personalPension:
          updateSocialInsuranceDto.personalPension ??
          existingData.personalPension,
        personalUnemployment:
          updateSocialInsuranceDto.personalUnemployment ??
          existingData.personalUnemployment,
        companyMedical:
          updateSocialInsuranceDto.companyMedical ??
          existingData.companyMedical,
        companyPension:
          updateSocialInsuranceDto.companyPension ??
          existingData.companyPension,
        companyUnemployment:
          updateSocialInsuranceDto.companyUnemployment ??
          existingData.companyUnemployment,
        companyInjury:
          updateSocialInsuranceDto.companyInjury ?? existingData.companyInjury,
      };

      // 计算新的合计值
      const calculatedValues = this.calculateTotals(mergedData);

      // 更新DTO中的计算字段
      updateSocialInsuranceDto.personalTotal = calculatedValues.personalTotal;
      updateSocialInsuranceDto.companyTotal = calculatedValues.companyTotal;
      updateSocialInsuranceDto.grandTotal = calculatedValues.grandTotal;

      console.log(
        '计算后的更新数据:',
        JSON.stringify({
          personalTotal: updateSocialInsuranceDto.personalTotal,
          companyTotal: updateSocialInsuranceDto.companyTotal,
          grandTotal: updateSocialInsuranceDto.grandTotal,
        }),
      );
    }

    // 执行更新操作
    await this.socialInsuranceRepository.update(
      safeId,
      updateSocialInsuranceDto,
    );
    return this.findOne(safeId);
  }

  async remove(id: number): Promise<void> {
    // 确保id是有效的数字
    const safeId = Number(id);
    if (isNaN(safeId)) {
      console.error(`删除时无效的ID值: ${id}, 转换后: ${safeId}`);
      return;
    }
    await this.socialInsuranceRepository.delete(safeId);
  }

  /**
   * 计算个人合计、公司合计和总合计
   */
  private calculateTotals(data: {
    personalMedical?: number;
    personalPension?: number;
    personalUnemployment?: number;
    companyMedical?: number;
    companyPension?: number;
    companyUnemployment?: number;
    companyInjury?: number;
  }): {
    personalMedical: number;
    personalPension: number;
    personalUnemployment: number;
    personalTotal: number;
    companyMedical: number;
    companyPension: number;
    companyUnemployment: number;
    companyInjury: number;
    companyTotal: number;
    grandTotal: number;
  } {
    // 确保所有值都是有效的数字，转换为number类型并默认为0
    const personalMedical = this.toValidNumber(data.personalMedical);
    const personalPension = this.toValidNumber(data.personalPension);
    const personalUnemployment = this.toValidNumber(data.personalUnemployment);
    const companyMedical = this.toValidNumber(data.companyMedical);
    const companyPension = this.toValidNumber(data.companyPension);
    const companyUnemployment = this.toValidNumber(data.companyUnemployment);
    const companyInjury = this.toValidNumber(data.companyInjury);

    // 计算个人合计 (保留两位小数)
    const personalTotal = this.roundToTwoDecimals(
      personalMedical + personalPension + personalUnemployment,
    );

    // 计算公司合计 (保留两位小数)
    const companyTotal = this.roundToTwoDecimals(
      companyMedical + companyPension + companyUnemployment + companyInjury,
    );

    // 计算总合计 (保留两位小数)
    // 总是重新计算总合计，确保数据一致性
    const grandTotal = this.roundToTwoDecimals(personalTotal + companyTotal);

    console.log('计算合计结果:', {
      personalTotal,
      companyTotal,
      grandTotal,
    });

    // 只返回数值相关字段
    return {
      personalMedical,
      personalPension,
      personalUnemployment,
      personalTotal,
      companyMedical,
      companyPension,
      companyUnemployment,
      companyInjury,
      companyTotal,
      grandTotal,
    };
  }

  /**
   * 将输入值转换为有效的数字
   * 处理null、undefined、NaN和字符串等情况
   */
  private toValidNumber(value: any): number {
    // 如果值不存在，返回0
    if (value === null || value === undefined) {
      return 0;
    }

    // 尝试转换为数字
    const num = Number(value);

    // 如果是NaN，返回0
    if (isNaN(num)) {
      return 0;
    }

    // 返回转换后的数字，保留两位小数
    return this.roundToTwoDecimals(num);
  }

  /**
   * 将数字四舍五入到两位小数
   */
  private roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}
