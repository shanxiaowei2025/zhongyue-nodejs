import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../expense/entities/expense.entity';
import { QueryBusinessStatisticsDto } from './dto/query-business-statistics.dto';
import { BusinessStatisticsResponseDto, BusinessStatisticsItemDto } from './dto/business-statistics-response.dto';

@Injectable()
export class BusinessStatisticsService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async getBusinessStatistics(query: QueryBusinessStatisticsDto): Promise<BusinessStatisticsResponseDto> {
    const startDate = (query as any).startDate;
    const endDate = (query as any).endDate;
    const salespersonRaw = (query as any).salesperson;
    const businessStatus = (query as any).businessStatus;

    // 构建查询条件
    let whereConditions = ['status = 1']; // 只统计已审核的数据
    let params = [];

    if (startDate) {
      whereConditions.push('chargeDate >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('chargeDate <= ?');
      params.push(endDate);
    }

    if (salespersonRaw !== undefined && salespersonRaw !== null && salespersonRaw !== '') {
      // support array or comma-separated string for multiple salespersons
      let salesArray: string[] = [];
      if (Array.isArray(salespersonRaw)) {
        salesArray = salespersonRaw.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (typeof salespersonRaw === 'string' && salespersonRaw.includes(',')) {
        salesArray = salespersonRaw.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        const val = String(salespersonRaw).trim();
        if (val) salesArray = [val];
      }

      if (salesArray.length === 1) {
        whereConditions.push('salesperson = ?');
        params.push(salesArray[0]);
      } else if (salesArray.length > 1) {
        const placeholders = salesArray.map(() => '?').join(', ');
        whereConditions.push(`salesperson IN (${placeholders})`);
        params.push(...salesArray);
      }
    }

    // 业务状态筛选逻辑
    if (businessStatus === '续费') {
      // 当业务状态为"续费"时，只统计 businessType 或者 socialInsuranceBusinessType 为"续费"的数据
      whereConditions.push('(businessType = ? OR socialInsuranceBusinessType = ?)');
      params.push('续费', '续费');
    } else if (businessStatus === '新增') {
      // 当业务状态为"新增"时，只统计 businessType 和 socialInsuranceBusinessType 全部不为"续费"的数据
      whereConditions.push('(businessType IS NULL OR businessType = "" OR businessType != ?)');
      whereConditions.push('(socialInsuranceBusinessType IS NULL OR socialInsuranceBusinessType = "" OR socialInsuranceBusinessType != ?)');
      params.push('续费', '续费');
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询数据，按业务员分组统计
    const querySql = `
      SELECT
        salesperson,
        SUM(COALESCE(licenseFee, 0)) as licenseFee,
        SUM(COALESCE(brandFee, 0)) as brandFee,
        SUM(COALESCE(recordSealFee, 0)) as recordSealFee,
        SUM(COALESCE(generalSealFee, 0)) as generalSealFee,
        SUM(COALESCE(agencyFee, 0)) as agencyFee,
        SUM(COALESCE(accountingSoftwareFee, 0)) as accountingSoftwareFee,
        SUM(COALESCE(addressFee, 0)) as addressFee,
        SUM(COALESCE(onlineBankingCustodyFee, 0)) as onlineBankingCustodyFee,
        SUM(COALESCE(invoiceSoftwareFee, 0)) as invoiceSoftwareFee,
        SUM(COALESCE(socialInsuranceAgencyFee, 0)) as socialInsuranceAgencyFee,
        SUM(COALESCE(housingFundAgencyFee, 0)) as housingFundAgencyFee,
        SUM(COALESCE(statisticalReportFee, 0)) as statisticalReportFee,
        SUM(COALESCE(customerDataOrganizationFee, 0)) as customerDataOrganizationFee,
        SUM(COALESCE(changeFee, 0)) as changeFee,
        SUM(COALESCE(administrativeLicenseFee, 0)) as administrativeLicenseFee,
        SUM(COALESCE(otherBusinessFee, 0)) as otherBusinessFee,
        SUM(COALESCE(otherBusinessOutsourcingFee, 0)) as otherBusinessOutsourcingFee,
        SUM(COALESCE(otherBusinessSpecialFee, 0)) as otherBusinessSpecialFee,
        SUM(COALESCE(totalFee, 0)) as totalFee
      FROM sys_expense
      WHERE ${whereClause}
      GROUP BY salesperson
      ORDER BY totalFee DESC
    `;

    const result = await this.expenseRepository.query(querySql, params);

    // 计算总计
    const summary: BusinessStatisticsItemDto = {
      salesperson: '总计',
      licenseFee: 0,
      brandFee: 0,
      recordSealFee: 0,
      generalSealFee: 0,
      agencyFee: 0,
      accountingSoftwareFee: 0,
      addressFee: 0,
      onlineBankingCustodyFee: 0,
      invoiceSoftwareFee: 0,
      socialInsuranceAgencyFee: 0,
      housingFundAgencyFee: 0,
      statisticalReportFee: 0,
      customerDataOrganizationFee: 0,
      changeFee: 0,
      administrativeLicenseFee: 0,
      otherBusinessFee: 0,
      otherBusinessOutsourcingFee: 0,
      otherBusinessSpecialFee: 0,
      totalFee: 0,
    };

    // 处理数据并计算总计
    const data: BusinessStatisticsItemDto[] = result.map((item) => {
      // 确保数值字段为数字类型
      const processedItem: BusinessStatisticsItemDto = {
        salesperson: item.salesperson || '未分配',
        licenseFee: Number(item.licenseFee) || 0,
        brandFee: Number(item.brandFee) || 0,
        recordSealFee: Number(item.recordSealFee) || 0,
        generalSealFee: Number(item.generalSealFee) || 0,
        agencyFee: Number(item.agencyFee) || 0,
        accountingSoftwareFee: Number(item.accountingSoftwareFee) || 0,
        addressFee: Number(item.addressFee) || 0,
        onlineBankingCustodyFee: Number(item.onlineBankingCustodyFee) || 0,
        invoiceSoftwareFee: Number(item.invoiceSoftwareFee) || 0,
        socialInsuranceAgencyFee: Number(item.socialInsuranceAgencyFee) || 0,
        housingFundAgencyFee: Number(item.housingFundAgencyFee) || 0,
        statisticalReportFee: Number(item.statisticalReportFee) || 0,
        customerDataOrganizationFee: Number(item.customerDataOrganizationFee) || 0,
        changeFee: Number(item.changeFee) || 0,
        administrativeLicenseFee: Number(item.administrativeLicenseFee) || 0,
        otherBusinessFee: Number(item.otherBusinessFee) || 0,
        otherBusinessOutsourcingFee: Number(item.otherBusinessOutsourcingFee) || 0,
        otherBusinessSpecialFee: Number(item.otherBusinessSpecialFee) || 0,
        totalFee: Number(item.totalFee) || 0,
      };

      // 累加到总计
      summary.licenseFee += processedItem.licenseFee;
      summary.brandFee += processedItem.brandFee;
      summary.recordSealFee += processedItem.recordSealFee;
      summary.generalSealFee += processedItem.generalSealFee;
      summary.agencyFee += processedItem.agencyFee;
      summary.accountingSoftwareFee += processedItem.accountingSoftwareFee;
      summary.addressFee += processedItem.addressFee;
      summary.onlineBankingCustodyFee += processedItem.onlineBankingCustodyFee;
      summary.invoiceSoftwareFee += processedItem.invoiceSoftwareFee;
      summary.socialInsuranceAgencyFee += processedItem.socialInsuranceAgencyFee;
      summary.housingFundAgencyFee += processedItem.housingFundAgencyFee;
      summary.statisticalReportFee += processedItem.statisticalReportFee;
      summary.customerDataOrganizationFee += processedItem.customerDataOrganizationFee;
      summary.changeFee += processedItem.changeFee;
      summary.administrativeLicenseFee += processedItem.administrativeLicenseFee;
      summary.otherBusinessFee += processedItem.otherBusinessFee;
      summary.otherBusinessOutsourcingFee += processedItem.otherBusinessOutsourcingFee;
      summary.otherBusinessSpecialFee += processedItem.otherBusinessSpecialFee;
      summary.totalFee += processedItem.totalFee;

      return processedItem;
    });

    return {
      data,
      summary,
      total: data.length,
    };
  }

  async getBusinessStatisticsByLocation(query: QueryBusinessStatisticsDto): Promise<BusinessStatisticsResponseDto> {
    const startDate = (query as any).startDate;
    const endDate = (query as any).endDate;
    const salespersonRaw = (query as any).salesperson;
    const businessStatus = (query as any).businessStatus;

    // 构建查询条件
    let whereConditions = ['status = 1']; // 只统计已审核的数据
    let params = [];

    if (startDate) {
      whereConditions.push('chargeDate >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('chargeDate <= ?');
      params.push(endDate);
    }

    if (salespersonRaw !== undefined && salespersonRaw !== null && salespersonRaw !== '') {
      // support array or comma-separated string for multiple salespersons
      let salesArray: string[] = [];
      if (Array.isArray(salespersonRaw)) {
        salesArray = salespersonRaw.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (typeof salespersonRaw === 'string' && salespersonRaw.includes(',')) {
        salesArray = salespersonRaw.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        const val = String(salespersonRaw).trim();
        if (val) salesArray = [val];
      }

      if (salesArray.length === 1) {
        whereConditions.push('salesperson = ?');
        params.push(salesArray[0]);
      } else if (salesArray.length > 1) {
        const placeholders = salesArray.map(() => '?').join(', ');
        whereConditions.push(`salesperson IN (${placeholders})`);
        params.push(...salesArray);
      }
    }

    // 业务状态筛选逻辑
    if (businessStatus === '续费') {
      // 当业务状态为"续费"时，只统计 businessType 或者 socialInsuranceBusinessType 为"续费"的数据
      whereConditions.push('(businessType = ? OR socialInsuranceBusinessType = ?)');
      params.push('续费', '续费');
    } else if (businessStatus === '新增') {
      // 当业务状态为"新增"时，只统计 businessType 和 socialInsuranceBusinessType 全部不为"续费"的数据
      whereConditions.push('(businessType IS NULL OR businessType = "" OR businessType != ?)');
      whereConditions.push('(socialInsuranceBusinessType IS NULL OR socialInsuranceBusinessType = "" OR socialInsuranceBusinessType != ?)');
      params.push('续费', '续费');
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询数据，按公司地点分组统计
    const querySql = `
      SELECT
        COALESCE(companyLocation, '未分配') as companyLocation,
        SUM(COALESCE(licenseFee, 0)) as licenseFee,
        SUM(COALESCE(brandFee, 0)) as brandFee,
        SUM(COALESCE(recordSealFee, 0)) as recordSealFee,
        SUM(COALESCE(generalSealFee, 0)) as generalSealFee,
        SUM(COALESCE(agencyFee, 0)) as agencyFee,
        SUM(COALESCE(accountingSoftwareFee, 0)) as accountingSoftwareFee,
        SUM(COALESCE(addressFee, 0)) as addressFee,
        SUM(COALESCE(onlineBankingCustodyFee, 0)) as onlineBankingCustodyFee,
        SUM(COALESCE(invoiceSoftwareFee, 0)) as invoiceSoftwareFee,
        SUM(COALESCE(socialInsuranceAgencyFee, 0)) as socialInsuranceAgencyFee,
        SUM(COALESCE(housingFundAgencyFee, 0)) as housingFundAgencyFee,
        SUM(COALESCE(statisticalReportFee, 0)) as statisticalReportFee,
        SUM(COALESCE(customerDataOrganizationFee, 0)) as customerDataOrganizationFee,
        SUM(COALESCE(changeFee, 0)) as changeFee,
        SUM(COALESCE(administrativeLicenseFee, 0)) as administrativeLicenseFee,
        SUM(COALESCE(otherBusinessFee, 0)) as otherBusinessFee,
        SUM(COALESCE(otherBusinessOutsourcingFee, 0)) as otherBusinessOutsourcingFee,
        SUM(COALESCE(otherBusinessSpecialFee, 0)) as otherBusinessSpecialFee,
        SUM(COALESCE(totalFee, 0)) as totalFee
      FROM sys_expense
      WHERE ${whereClause}
      GROUP BY companyLocation
      ORDER BY totalFee DESC
    `;

    const result = await this.expenseRepository.query(querySql, params);

    // 计算总计
    const summary: BusinessStatisticsItemDto = {
      salesperson: '总计',
      licenseFee: 0,
      brandFee: 0,
      recordSealFee: 0,
      generalSealFee: 0,
      agencyFee: 0,
      accountingSoftwareFee: 0,
      addressFee: 0,
      onlineBankingCustodyFee: 0,
      invoiceSoftwareFee: 0,
      socialInsuranceAgencyFee: 0,
      housingFundAgencyFee: 0,
      statisticalReportFee: 0,
      customerDataOrganizationFee: 0,
      changeFee: 0,
      administrativeLicenseFee: 0,
      otherBusinessFee: 0,
      otherBusinessOutsourcingFee: 0,
      otherBusinessSpecialFee: 0,
      totalFee: 0,
    };

    // 处理数据并计算总计
    const data: BusinessStatisticsItemDto[] = result.map((item) => {
      // 确保数值字段为数字类型
      const processedItem: BusinessStatisticsItemDto = {
        salesperson: item.companyLocation || '未分配',
        licenseFee: Number(item.licenseFee) || 0,
        brandFee: Number(item.brandFee) || 0,
        recordSealFee: Number(item.recordSealFee) || 0,
        generalSealFee: Number(item.generalSealFee) || 0,
        agencyFee: Number(item.agencyFee) || 0,
        accountingSoftwareFee: Number(item.accountingSoftwareFee) || 0,
        addressFee: Number(item.addressFee) || 0,
        onlineBankingCustodyFee: Number(item.onlineBankingCustodyFee) || 0,
        invoiceSoftwareFee: Number(item.invoiceSoftwareFee) || 0,
        socialInsuranceAgencyFee: Number(item.socialInsuranceAgencyFee) || 0,
        housingFundAgencyFee: Number(item.housingFundAgencyFee) || 0,
        statisticalReportFee: Number(item.statisticalReportFee) || 0,
        customerDataOrganizationFee: Number(item.customerDataOrganizationFee) || 0,
        changeFee: Number(item.changeFee) || 0,
        administrativeLicenseFee: Number(item.administrativeLicenseFee) || 0,
        otherBusinessFee: Number(item.otherBusinessFee) || 0,
        otherBusinessOutsourcingFee: Number(item.otherBusinessOutsourcingFee) || 0,
        otherBusinessSpecialFee: Number(item.otherBusinessSpecialFee) || 0,
        totalFee: Number(item.totalFee) || 0,
      };

      // 累加到总计
      summary.licenseFee += processedItem.licenseFee;
      summary.brandFee += processedItem.brandFee;
      summary.recordSealFee += processedItem.recordSealFee;
      summary.generalSealFee += processedItem.generalSealFee;
      summary.agencyFee += processedItem.agencyFee;
      summary.accountingSoftwareFee += processedItem.accountingSoftwareFee;
      summary.addressFee += processedItem.addressFee;
      summary.onlineBankingCustodyFee += processedItem.onlineBankingCustodyFee;
      summary.invoiceSoftwareFee += processedItem.invoiceSoftwareFee;
      summary.socialInsuranceAgencyFee += processedItem.socialInsuranceAgencyFee;
      summary.housingFundAgencyFee += processedItem.housingFundAgencyFee;
      summary.statisticalReportFee += processedItem.statisticalReportFee;
      summary.customerDataOrganizationFee += processedItem.customerDataOrganizationFee;
      summary.changeFee += processedItem.changeFee;
      summary.administrativeLicenseFee += processedItem.administrativeLicenseFee;
      summary.otherBusinessFee += processedItem.otherBusinessFee;
      summary.otherBusinessOutsourcingFee += processedItem.otherBusinessOutsourcingFee;
      summary.otherBusinessSpecialFee += processedItem.otherBusinessSpecialFee;
      summary.totalFee += processedItem.totalFee;

      return processedItem;
    });

    return {
      data,
      summary,
      total: data.length,
    };
  }
}
