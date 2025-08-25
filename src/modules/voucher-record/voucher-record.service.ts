import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, SelectQueryBuilder, In } from 'typeorm';
import { VoucherRecordYear } from './entities/voucher-record-year.entity';
import { VoucherRecordMonth } from './entities/voucher-record-month.entity';
import { CreateVoucherRecordYearDto } from './dto/create-voucher-record-year.dto';
import { UpdateVoucherRecordYearDto } from './dto/update-voucher-record-year.dto';
import { CreateVoucherRecordMonthDto } from './dto/create-voucher-record-month.dto';
import { UpdateVoucherRecordMonthDto } from './dto/update-voucher-record-month.dto';
import { QueryVoucherRecordDto } from './dto/query-voucher-record.dto';
import { ExportVoucherRecordDto } from './dto/export-voucher-record.dto';
import ExcelJS from 'exceljs';

@Injectable()
export class VoucherRecordService {
  constructor(
    @InjectRepository(VoucherRecordYear)
    private readonly yearRepository: Repository<VoucherRecordYear>,
    @InjectRepository(VoucherRecordMonth)
    private readonly monthRepository: Repository<VoucherRecordMonth>,
  ) {}

  // 年度记录相关方法
  async createYear(createDto: CreateVoucherRecordYearDto): Promise<VoucherRecordYear> {
    // 检查同一客户同一年度是否已存在记录
    const existing = await this.yearRepository.findOne({
      where: {
        customerId: createDto.customerId,
        year: createDto.year,
      },
    });

    if (existing) {
      throw new ConflictException(`客户ID ${createDto.customerId} 在 ${createDto.year} 年的记录已存在`);
    }

    const yearRecord = this.yearRepository.create(createDto);
    const saved = await this.yearRepository.save(yearRecord);

    // 自动创建12个月的记录，状态为未设置
    const monthRecords = [];
    for (let month = 1; month <= 12; month++) {
      const monthRecord = this.monthRepository.create({
        yearRecordId: saved.id,
        month,
        status: null, // 初始状态为空，由前端设置
      });
      monthRecords.push(monthRecord);
    }
    await this.monthRepository.save(monthRecords);

    return this.findYearById(saved.id);
  }

  async findAllYears(query: QueryVoucherRecordDto) {
    const { page = 1, limit = 10, customerId, year, storageLocation, handler, status } = query;

    const queryBuilder: SelectQueryBuilder<VoucherRecordYear> = this.yearRepository
      .createQueryBuilder('year')
      .leftJoinAndSelect('year.customer', 'customer')
      .leftJoinAndSelect('year.months', 'months');

    // 添加筛选条件
    if (customerId) {
      queryBuilder.andWhere('year.customerId = :customerId', { customerId });
    }

    if (year) {
      queryBuilder.andWhere('year.year = :year', { year });
    }

    if (storageLocation) {
      queryBuilder.andWhere('year.storageLocation LIKE :storageLocation', {
        storageLocation: `%${storageLocation}%`,
      });
    }

    if (handler) {
      queryBuilder.andWhere('year.handler LIKE :handler', {
        handler: `%${handler}%`,
      });
    }

    // 处理月度状态筛选
    if (status) {
      queryBuilder.andWhere('months.status = :status', { status });
    }

    // 排序
    queryBuilder.orderBy('year.year', 'DESC')
                .addOrderBy('year.createdAt', 'DESC')
                .addOrderBy('months.month', 'ASC');

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [records, total] = await queryBuilder.getManyAndCount();

    return {
      records,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findYearById(id: number): Promise<VoucherRecordYear> {
    const record = await this.yearRepository.findOne({
      where: { id },
      relations: ['customer', 'months'],
      order: {
        months: {
          month: 'ASC',
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`年度记录 ID ${id} 不存在`);
    }

    return record;
  }

  async updateYear(id: number, updateDto: UpdateVoucherRecordYearDto): Promise<VoucherRecordYear> {
    const record = await this.findYearById(id);

    // 如果更新了客户ID或年度，需要检查唯一性
    if (updateDto.customerId || updateDto.year) {
      const customerId = updateDto.customerId || record.customerId;
      const year = updateDto.year || record.year;

      const existing = await this.yearRepository.findOne({
        where: {
          customerId,
          year,
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`客户ID ${customerId} 在 ${year} 年的记录已存在`);
      }
    }

    Object.assign(record, updateDto);
    await this.yearRepository.save(record);

    return this.findYearById(id);
  }

  async removeYear(id: number): Promise<void> {
    const record = await this.findYearById(id);
    await this.yearRepository.remove(record);
  }

  // 月度记录相关方法
  async createMonth(createDto: CreateVoucherRecordMonthDto): Promise<VoucherRecordMonth> {
    // 检查年度记录是否存在
    const yearRecord = await this.yearRepository.findOne({
      where: { id: createDto.yearRecordId },
    });

    if (!yearRecord) {
      throw new NotFoundException(`年度记录 ID ${createDto.yearRecordId} 不存在`);
    }

    // 检查同一年度记录的同一月份是否已存在
    const existing = await this.monthRepository.findOne({
      where: {
        yearRecordId: createDto.yearRecordId,
        month: createDto.month,
      },
    });

    if (existing) {
      throw new ConflictException(`年度记录 ${createDto.yearRecordId} 的 ${createDto.month} 月记录已存在`);
    }

    const monthRecord = this.monthRepository.create(createDto);
    return await this.monthRepository.save(monthRecord);
  }

  async findMonthById(id: number): Promise<VoucherRecordMonth> {
    const record = await this.monthRepository.findOne({
      where: { id },
      relations: ['yearRecord', 'yearRecord.customer'],
    });

    if (!record) {
      throw new NotFoundException(`月度记录 ID ${id} 不存在`);
    }

    return record;
  }

  async updateMonth(id: number, updateDto: UpdateVoucherRecordMonthDto): Promise<VoucherRecordMonth> {
    const record = await this.findMonthById(id);

    Object.assign(record, updateDto);
    await this.monthRepository.save(record);

    return this.findMonthById(id);
  }

  async removeMonth(id: number): Promise<void> {
    const record = await this.findMonthById(id);
    const yearRecordId = record.yearRecordId;
    
    // 删除月度记录
    await this.monthRepository.remove(record);
    
    // 检查该年度记录下是否还有其他月度记录
    const remainingMonths = await this.monthRepository.count({
      where: { yearRecordId }
    });
    
    // 如果没有剩余月度记录，删除年度记录
    if (remainingMonths === 0) {
      await this.yearRepository.delete(yearRecordId);
    }
  }

  // 批量删除月度记录（根据年度记录ID）
  async removeMonthsByYearRecord(yearRecordId: number): Promise<void> {
    // 检查年度记录是否存在
    const yearRecord = await this.yearRepository.findOne({
      where: { id: yearRecordId }
    });

    if (!yearRecord) {
      throw new NotFoundException(`年度记录 ID ${yearRecordId} 不存在`);
    }

    // 删除该年度记录下的所有月度记录
    await this.monthRepository.delete({ yearRecordId });
    
    // 删除年度记录（因为没有月度记录了）
    await this.yearRepository.delete(yearRecordId);
  }

  // 批量删除月度记录（根据ID数组）
  async removeMonthsByIds(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('月度记录ID数组不能为空');
    }

    // 获取所有要删除的月度记录，用于获取关联的年度记录ID
    const monthRecords = await this.monthRepository.find({
      where: { id: In(ids) },
      select: ['id', 'yearRecordId']
    });

    if (monthRecords.length === 0) {
      throw new NotFoundException('没有找到要删除的月度记录');
    }

    // 收集所有相关的年度记录ID
    const yearRecordIds = [...new Set(monthRecords.map(record => record.yearRecordId))];

    // 删除月度记录
    await this.monthRepository.delete(ids);

    // 检查每个年度记录是否还有剩余的月度记录
    for (const yearRecordId of yearRecordIds) {
      const remainingMonths = await this.monthRepository.count({
        where: { yearRecordId }
      });
      
      // 如果没有剩余月度记录，删除年度记录
      if (remainingMonths === 0) {
        await this.yearRepository.delete(yearRecordId);
      }
    }
  }

  // 批量更新月度状态
  async batchUpdateMonthStatus(
    yearRecordId: number,
    updates: Array<{ month: number; status: string; description?: string }>
  ): Promise<VoucherRecordMonth[]> {
    // 检查年度记录是否存在
    const yearRecord = await this.yearRepository.findOne({
      where: { id: yearRecordId },
    });

    if (!yearRecord) {
      throw new NotFoundException(`年度记录 ID ${yearRecordId} 不存在`);
    }

    const results = [];
    for (const update of updates) {
      const { month, status, description } = update;

      // 查找或创建月度记录
      let monthRecord = await this.monthRepository.findOne({
        where: { yearRecordId, month },
      });

      if (!monthRecord) {
        monthRecord = this.monthRepository.create({
          yearRecordId,
          month,
          status,
          description,
        });
      } else {
        monthRecord.status = status;
        if (description !== undefined) {
          monthRecord.description = description;
        }
      }

      const saved = await this.monthRepository.save(monthRecord);
      results.push(saved);
    }

    return results;
  }

  // 获取月度统计信息
  async getMonthStatistics(yearRecordId: number) {
    const months = await this.monthRepository.find({
      where: { yearRecordId },
      order: { month: 'ASC' },
    });

    const total = months.length;
    // 由于状态由前端自定义，这里返回每种状态的统计
    const statusCounts = months.reduce((acc, month) => {
      const status = month.status || '未设置';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 计算有状态的月份数量（非空且非"未设置"）
    const withStatus = months.filter(m => m.status && m.status !== '未设置').length;
    const completionRate = total > 0 ? Math.round((withStatus / total) * 100) : 0;

    return {
      yearRecordId,
      total,
      statusCounts, // 各状态的统计数量
      withStatus, // 有状态的月份数量
      completionRate, // 完成率（基于有状态的月份）
      months,
    };
  }

  // 获取客户的所有年度记录
  async findYearsByCustomer(customerId: number): Promise<VoucherRecordYear[]> {
    return await this.yearRepository.find({
      where: { customerId },
      relations: ['customer', 'months'],
      order: {
        year: 'DESC',
        months: {
          month: 'ASC',
        },
      },
    });
  }

  /**
   * 导出凭证记录为Excel文件
   */
  async exportVoucherRecords(exportDto: ExportVoucherRecordDto): Promise<Buffer> {
    const { customerIds = [], year, bookkeepingAccountant, consultantAccountant } = exportDto;

    const queryBuilder = this.yearRepository.createQueryBuilder('year')
      .leftJoinAndSelect('year.customer', 'customer')
      .leftJoinAndSelect('year.months', 'month');

    // 添加过滤条件
    if (customerIds.length > 0) {
      queryBuilder.andWhere('year.customerId IN (:...customerIds)', { customerIds });
    }

    if (year) {
      queryBuilder.andWhere('year.year = :year', { year });
    }

    if (bookkeepingAccountant) {
      queryBuilder.andWhere('customer.bookkeepingAccountant = :bookkeepingAccountant', { bookkeepingAccountant });
    }

    if (consultantAccountant) {
      queryBuilder.andWhere('customer.consultantAccountant = :consultantAccountant', { consultantAccountant });
    }

    queryBuilder.orderBy({
      'customer.companyName': 'ASC',
      'year.year': 'DESC',
      'month.month': 'ASC'
    });

    const yearRecords = await queryBuilder.getMany();

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('凭证记录');

    // 设置列标题
    worksheet.columns = [
      { header: '客户名称', key: 'customerName', width: 30 },
      { header: '年份', key: 'year', width: 10 },
      { header: '月份', key: 'month', width: 10 },
      { header: '状态', key: 'status', width: 15 },
      { header: '说明/备注', key: 'description', width: 40 },
      { header: '创建时间', key: 'createdAt', width: 20 },
      { header: '记账会计', key: 'bookkeepingAccountant', width: 15 },
      { header: '顾问会计', key: 'consultantAccountant', width: 15 },
      { header: '存放位置', key: 'storageLocation', width: 25 },
      { header: '经手人', key: 'handler', width: 15 },
      { header: '取走记录', key: 'withdrawalRecord', width: 30 },
      { header: '通用备注', key: 'generalRemarks', width: 30 }
    ];

    // 设置标题行样式
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 添加数据行
    let rowIndex = 2;
    for (const yearRecord of yearRecords) {
      if (yearRecord.months && yearRecord.months.length > 0) {
        for (const monthRecord of yearRecord.months) {
          worksheet.addRow({
            customerName: yearRecord.customer.companyName || '',
            year: yearRecord.year,
            month: monthRecord.month,
            status: monthRecord.status || '',
            description: monthRecord.description || '',
            createdAt: monthRecord.createdAt ? monthRecord.createdAt.toISOString().split('T')[0] : '',
            bookkeepingAccountant: yearRecord.customer.bookkeepingAccountant || '',
            consultantAccountant: yearRecord.customer.consultantAccountant || '',
            storageLocation: yearRecord.storageLocation || '',
            handler: yearRecord.handler || '',
            withdrawalRecord: yearRecord.withdrawalRecord || '',
            generalRemarks: yearRecord.generalRemarks || ''
          });

          // 设置数据行样式
          const dataRow = worksheet.getRow(rowIndex);
          dataRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle' };
          });
          
          rowIndex++;
        }
      } else {
        // 如果没有月度记录，仍然显示年度信息
        worksheet.addRow({
          customerName: yearRecord.customer.companyName || '',
          year: yearRecord.year,
          month: '',
          status: '',
          description: '',
          createdAt: yearRecord.createdAt ? yearRecord.createdAt.toISOString().split('T')[0] : '',
          bookkeepingAccountant: yearRecord.customer.bookkeepingAccountant || '',
          consultantAccountant: yearRecord.customer.consultantAccountant || '',
          storageLocation: yearRecord.storageLocation || '',
          handler: yearRecord.handler || '',
          withdrawalRecord: yearRecord.withdrawalRecord || '',
          generalRemarks: yearRecord.generalRemarks || ''
        });

        const dataRow = worksheet.getRow(rowIndex);
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
        });
        
        rowIndex++;
      }
    }

    // 自动调整列宽
    worksheet.columns.forEach(column => {
      if (column.width && column.width < 10) {
        column.width = 10;
      }
    });

    // 生成Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
} 