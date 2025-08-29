import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Res,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './services/reports.service';
// import { ReportsExportService } from './services/reports-export.service'; // 临时注释掉导出服务
import {
  AgencyFeeAnalysisDto,
  NewCustomerStatsDto,
  EmployeePerformanceDto,
  CustomerLevelDistributionDto,
  CustomerChurnStatsDto,
  ServiceExpiryStatsDto,
  AccountantClientStatsDto,
} from './dto/report-query.dto';
import {
  AgencyFeeAnalysisResponse,
  NewCustomerStatsResponse,
  EmployeePerformanceResponse,
  CustomerLevelDistributionResponse,
  CustomerChurnStatsResponse,
  ServiceExpiryStatsResponse,
  AccountantClientStatsResponse,
} from './dto/report-response.dto';

@ApiTags('报表管理')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true }))
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly reportsService: ReportsService,
    // private readonly exportService: ReportsExportService, // 临时注释掉导出服务
  ) {}

  @Get('agency-fee-analysis')
  @ApiOperation({ 
    summary: '代理费收费变化分析', 
    description: '识别代理费今年相比去年减少≥阈值的客户。数据权限基于expense_data_view_all（查看所有）、expense_data_view_by_location（按区域查看）、expense_data_view_own（查看自己）三个权限控制。' 
  })
  @ApiQuery({ name: 'sortField', required: false, enum: ['customerId', 'currentYearFee', 'previousYearFee', 'decreaseAmount', 'decreaseRate'], description: '排序字段：customerId-客户ID，currentYearFee-当年费用，previousYearFee-去年费用，decreaseAmount-下降金额，decreaseRate-下降率' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: '排序类型：ASC-升序，DESC-降序' })
  @ApiResponse({ 
    status: 200, 
    description: '返回代理费收费变化分析数据，根据用户权限过滤', 
    type: AgencyFeeAnalysisResponse 
  })
  async getAgencyFeeAnalysis(
    @Query() query: AgencyFeeAnalysisDto,
    @Request() req: any
  ): Promise<AgencyFeeAnalysisResponse> {
    try {
      this.logger.log(`用户 ${req.user.id}(${req.user.username}) 请求代理费收费变化分析，参数: ${JSON.stringify(query)}`);
      const result = await this.reportsService.getAgencyFeeAnalysis(query, req.user.id);
      this.logger.log(`代理费收费变化分析完成，返回 ${result.list.length} 条记录，总计 ${result.total} 条`);
      return result;
    } catch (error) {
      this.logger.error(`代理费收费变化分析失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '代理费收费变化分析失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 临时注释掉导出API - 以后需要时可以重新启用
  /*
  @Get('agency-fee-analysis/export')
  @ApiOperation({ 
    summary: '导出代理费收费变化分析', 
    description: '导出代理费收费变化分析Excel报表' 
  })
  async exportAgencyFeeAnalysis(
    @Query() query: AgencyFeeAnalysisDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    try {
      this.logger.log(`用户 ${req.user.id} 导出代理费收费变化分析`);
      
      const data = await this.reportsService.getAgencyFeeAnalysis(query, req.user.id);
      const buffer = await this.exportService.exportAgencyFeeAnalysis(data);
      
      const filename = `代理费收费变化分析_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      res.end(buffer);
    } catch (error) {
      this.logger.error(`导出代理费收费变化分析失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '导出失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  */

  @Get('new-customer-stats')
  @ApiOperation({ 
    summary: '新增客户统计'
  })
  @ApiQuery({ name: 'year', required: false, description: '年份' })
  @ApiQuery({ name: 'month', required: false, description: '月份' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期 YYYY-MM-DD，基于客户创建时间' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期 YYYY-MM-DD，基于客户创建时间' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认10' })
  @ApiQuery({ name: 'sortField', required: false, enum: ['customerId'], description: '排序字段：customerId-客户ID' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: '排序类型' })
  @ApiResponse({ 
    status: 200, 
    description: '返回新增客户统计数据', 
    type: NewCustomerStatsResponse 
  })
  async getNewCustomerStats(
    @Query() query: NewCustomerStatsDto,
    @Request() req: any
  ): Promise<NewCustomerStatsResponse> {
    try {
      this.logger.log(`用户 ${req.user.id} 请求新增客户统计`);
      return await this.reportsService.getNewCustomerStats(query, req.user.id);
    } catch (error) {
      this.logger.error(`新增客户统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '新增客户统计失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 临时注释掉导出API - 以后需要时可以重新启用
  /*
  @Get('new-customer-stats/export')
  @ApiOperation({ 
    summary: '导出新增客户统计', 
    description: '导出新增客户统计Excel报表' 
  })
  async exportNewCustomerStats(
    @Query() query: NewCustomerStatsDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    try {
      this.logger.log(`用户 ${req.user.id} 导出新增客户统计`);
      
      const data = await this.reportsService.getNewCustomerStats(query, req.user.id);
      const buffer = await this.exportService.exportNewCustomerStats(data);
      
      const filename = `新增客户统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      res.end(buffer);
    } catch (error) {
      this.logger.error(`导出新增客户统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '导出失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  */

  @Get('employee-performance')
  @ApiOperation({ 
    summary: '员工业绩统计', 
    description: '统计业务员(salesperson)的新增、续费、其他业务业绩，基于已审核通过的费用数据。数据权限基于expense_data_view_all（查看所有）、expense_data_view_by_location（按区域查看）、expense_data_view_own（查看自己）三个权限控制。' 
  })
  @ApiQuery({ name: 'sortField', required: false, enum: ['totalRevenue', 'newCustomerRevenue', 'renewalRevenue', 'customerCount', 'otherRevenue'], description: '排序字段：totalRevenue-总收入，newCustomerRevenue-新客户收入，renewalRevenue-续费收入，customerCount-客户数量，otherRevenue-其他收入' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: '排序类型：ASC-升序，DESC-降序' })
  @ApiResponse({ 
    status: 200, 
    description: '返回员工业绩统计数据，根据用户权限过滤', 
    type: EmployeePerformanceResponse 
  })
  async getEmployeePerformance(
    @Query() query: EmployeePerformanceDto,
    @Request() req: any
  ): Promise<EmployeePerformanceResponse> {
    try {
      this.logger.log(`用户 ${req.user.id} 请求员工业绩统计`);
      return await this.reportsService.getEmployeePerformance(query, req.user.id);
    } catch (error) {
      this.logger.error(`员工业绩统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '员工业绩统计失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 临时注释掉导出API - 以后需要时可以重新启用
  /*
  @Get('employee-performance/export')
  @ApiOperation({ 
    summary: '导出员工业绩统计', 
    description: '导出员工业绩统计Excel报表' 
  })
  async exportEmployeePerformance(
    @Query() query: EmployeePerformanceDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    try {
      this.logger.log(`用户 ${req.user.id} 导出员工业绩统计`);
      
      const data = await this.reportsService.getEmployeePerformance(query, req.user.id);
      const buffer = await this.exportService.exportEmployeePerformance(data);
      
      const filename = `员工业绩统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      res.end(buffer);
    } catch (error) {
      this.logger.error(`导出员工业绩统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '导出失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  */

  @Get('customer-level-distribution')
  @ApiOperation({ 
    summary: '客户等级分布统计', 
    description: '统计各等级客户数量和贡献分布。支持按年/月时间过滤和等级筛选：只传year按年统计，传year+month按月统计，只传month按当年该月统计，都不传按当前年月统计。分页参数应用到客户详情列表。' 
  })
  @ApiQuery({ name: 'level', required: false, description: '客户等级筛选，如：AA' })
  @ApiQuery({ name: 'sortField', required: false, enum: ['level', 'contributionAmount'], description: '排序字段：level-等级，contributionAmount-贡献金额' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: '排序类型：ASC-升序，DESC-降序' })
  @ApiResponse({ 
    status: 200, 
    description: '返回客户等级分布统计数据，list为客户详情列表(分页)，levelStats为等级统计信息(不分页)', 
    type: CustomerLevelDistributionResponse 
  })
  async getCustomerLevelDistribution(
    @Query() query: CustomerLevelDistributionDto,
    @Request() req: any
  ): Promise<CustomerLevelDistributionResponse> {
    try {
      this.logger.log(`用户 ${req.user.id} 请求客户等级分布统计`);
      return await this.reportsService.getCustomerLevelDistribution(query, req.user.id);
    } catch (error) {
      this.logger.error(`客户等级分布统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '客户等级分布统计失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 临时注释掉导出API - 以后需要时可以重新启用
  /*
  @Get('customer-level-distribution/export')
  @ApiOperation({ 
    summary: '导出客户等级分布统计', 
    description: '导出客户等级分布统计Excel报表' 
  })
  async exportCustomerLevelDistribution(
    @Query() query: CustomerLevelDistributionDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    try {
      this.logger.log(`用户 ${req.user.id} 导出客户等级分布统计`);
      
      const data = await this.reportsService.getCustomerLevelDistribution(query, req.user.id);
      const buffer = await this.exportService.exportCustomerLevelDistribution(data);
      
      const filename = `客户等级分布统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      res.end(buffer);
    } catch (error) {
      this.logger.error(`导出客户等级分布统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '导出失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  */

  @Get('customer-churn-stats')
  @ApiOperation({ 
    summary: '客户流失统计', 
    description: '统计注销/流失客户数量和原因分布。支持按年/月时间过滤：只传year按年统计，传year+month按月统计，只传month按当年该月统计，都不传按当前年月统计。分页按客户详情分页，同时返回时间周期统计汇总。' 
  })
  @ApiQuery({ name: 'sortField', required: false, enum: ['period', 'churnCount', 'churnRate', 'churnDate'], description: '排序字段：period-时间周期，churnCount-流失数量，churnRate-流失率，churnDate-流失日期' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: '排序类型：ASC-升序，DESC-降序' })
  @ApiResponse({ 
    status: 200, 
    description: '返回客户流失统计数据，分页列表为客户详情，同时包含时间周期统计和汇总信息', 
    type: CustomerChurnStatsResponse 
  })
  async getCustomerChurnStats(
    @Query() query: CustomerChurnStatsDto,
    @Request() req: any
  ): Promise<CustomerChurnStatsResponse> {
    try {
      this.logger.log(`用户 ${req.user.id} 请求客户流失统计`);
      return await this.reportsService.getCustomerChurnStats(query, req.user.id);
    } catch (error) {
      this.logger.error(`客户流失统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '客户流失统计失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 临时注释掉导出API - 以后需要时可以重新启用
  /*
  @Get('customer-churn-stats/export')
  @ApiOperation({ 
    summary: '导出客户流失统计', 
    description: '导出客户流失统计Excel报表' 
  })
  async exportCustomerChurnStats(
    @Query() query: CustomerChurnStatsDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    try {
      this.logger.log(`用户 ${req.user.id} 导出客户流失统计`);
      
      const data = await this.reportsService.getCustomerChurnStats(query, req.user.id);
      const buffer = await this.exportService.exportCustomerChurnStats(data);
      
      const filename = `客户流失统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      res.end(buffer);
    } catch (error) {
      this.logger.error(`导出客户流失统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '导出失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  */

  @Get('service-expiry-stats')
  @ApiOperation({ 
    summary: '代理服务到期客户统计', 
    description: '统计代理记账服务已到期或即将到期的客户' 
  })
  @ApiQuery({ name: 'sortField', required: false, enum: ['customerId', 'agencyEndDate'], description: '排序字段：customerId-客户ID，agencyEndDate-代理结束日期' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: '排序类型：ASC-升序，DESC-降序' })
  @ApiResponse({ 
    status: 200, 
    description: '返回代理服务到期客户统计数据', 
    type: ServiceExpiryStatsResponse 
  })
  async getServiceExpiryStats(
    @Query() query: ServiceExpiryStatsDto,
    @Request() req: any
  ): Promise<ServiceExpiryStatsResponse> {
    try {
      this.logger.log(`用户 ${req.user.id} 请求代理服务到期客户统计`);
      return await this.reportsService.getServiceExpiryStats(query, req.user.id);
    } catch (error) {
      this.logger.error(`代理服务到期客户统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '代理服务到期客户统计失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 临时注释掉导出API - 以后需要时可以重新启用
  /*
  @Get('service-expiry-stats/export')
  @ApiOperation({ 
    summary: '导出代理服务到期客户统计', 
    description: '导出代理服务到期客户统计Excel报表' 
  })
  async exportServiceExpiryStats(
    @Query() query: ServiceExpiryStatsDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    try {
      this.logger.log(`用户 ${req.user.id} 导出代理服务到期客户统计`);
      
      const data = await this.reportsService.getServiceExpiryStats(query, req.user.id);
      const buffer = await this.exportService.exportServiceExpiryStats(data);
      
      const filename = `代理服务到期客户统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      res.end(buffer);
    } catch (error) {
      this.logger.error(`导出代理服务到期客户统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '导出失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  */

  @Get('accountant-client-stats')
  @ApiOperation({ 
    summary: '会计负责客户数量统计', 
    description: '统计每个顾问会计、记账会计和开票员负责的客户数量' 
  })
  @ApiQuery({ name: 'sortField', required: false, enum: ['clientCount'], description: '排序字段：clientCount-客户数量' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: '排序类型：ASC-升序，DESC-降序' })
  @ApiResponse({ 
    status: 200, 
    description: '返回会计负责客户数量统计数据', 
    type: AccountantClientStatsResponse 
  })
  async getAccountantClientStats(
    @Query() query: AccountantClientStatsDto,
    @Request() req: any
  ): Promise<AccountantClientStatsResponse> {
    try {
      this.logger.log(`用户 ${req.user.id} 请求会计负责客户数量统计`);
      return await this.reportsService.getAccountantClientStats(query, req.user.id);
    } catch (error) {
      this.logger.error(`会计负责客户数量统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '会计负责客户数量统计失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 临时注释掉导出API - 以后需要时可以重新启用
  /*
  @Get('accountant-client-stats/export')
  @ApiOperation({ 
    summary: '导出会计负责客户数量统计', 
    description: '导出会计负责客户数量统计Excel报表' 
  })
  async exportAccountantClientStats(
    @Query() query: AccountantClientStatsDto,
    @Request() req: any,
    @Res({ passthrough: false }) res: Response
  ): Promise<void> {
    try {
      this.logger.log(`用户 ${req.user.id} 导出会计负责客户数量统计`);
      
      const data = await this.reportsService.getAccountantClientStats(query, req.user.id);
      const buffer = await this.exportService.exportAccountantClientStats(data);
      
      const filename = `会计负责客户数量统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      
      res.end(buffer);
    } catch (error) {
      this.logger.error(`导出会计负责客户数量统计失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '导出失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  */
} 