import { ApiProperty } from '@nestjs/swagger';

/**
 * 分页响应DTO基类
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '数据列表' })
  list: T[];

  @ApiProperty({ description: '总数量' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

/**
 * 代理费收费变化分析 - 客户记录
 */
export class AgencyFeeAnalysisItem {
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '今年费用' })
  currentYearFee: number;

  @ApiProperty({ description: '去年费用' })
  previousYearFee: number;

  @ApiProperty({ description: '减少金额' })
  decreaseAmount: number;

  @ApiProperty({ description: '减少比例' })
  decreaseRate: number;

  @ApiProperty({ description: '顾问会计' })
  consultantAccountant: string;

  @ApiProperty({ description: '记账会计' })
  bookkeepingAccountant: string;
}

/**
 * 代理费收费变化分析 - 汇总信息
 */
export class AgencyFeeAnalysisSummary {
  @ApiProperty({ description: '总客户数' })
  totalCustomers: number;

  @ApiProperty({ description: '受影响客户数' })
  affectedCustomers: number;

  @ApiProperty({ description: '总减少金额' })
  totalDecrease: number;

  @ApiProperty({ description: '平均减少金额' })
  averageDecrease: number;
}

/**
 * 代理费收费变化分析响应
 */
export class AgencyFeeAnalysisResponse extends PaginatedResponseDto<AgencyFeeAnalysisItem> {
  @ApiProperty({ description: '汇总信息' })
  summary: AgencyFeeAnalysisSummary;
}

/**
 * 新增客户详情
 */
export class NewCustomerItem {
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;

  @ApiProperty({ description: '顾问会计' })
  consultantAccountant: string;

  @ApiProperty({ description: '记账会计' })
  bookkeepingAccountant: string;

  @ApiProperty({ description: '客户等级' })
  customerLevel: string;
}

/**
 * 月度新增客户统计
 */
export class MonthlyNewCustomerStats {
  @ApiProperty({ description: '月份 YYYY-MM' })
  month: string;

  @ApiProperty({ description: '总新增数量' })
  totalCount: number;

  @ApiProperty({ description: '用户有权限查看的数量' })
  authorizedCount: number;

  @ApiProperty({ description: '详细客户列表' })
  details: NewCustomerItem[];
}

/**
 * 新增客户统计响应
 */
export class NewCustomerStatsResponse {
  @ApiProperty({ description: '按月统计数据' })
  monthlyStats: MonthlyNewCustomerStats[];

  @ApiProperty({ description: '汇总信息' })
  summary: {
    totalNewCustomers: number;
    averagePerMonth: number;
  };
}

/**
 * 员工业绩统计项
 */
export class EmployeePerformanceItem {
  @ApiProperty({ description: '员工姓名' })
  employeeName: string;

  @ApiProperty({ description: '部门' })
  department: string;

  @ApiProperty({ description: '新增客户业绩' })
  newCustomerRevenue: number;

  @ApiProperty({ description: '续费业务业绩' })
  renewalRevenue: number;

  @ApiProperty({ description: '其他业务业绩' })
  otherRevenue: number;

  @ApiProperty({ description: '总业绩' })
  totalRevenue: number;

  @ApiProperty({ description: '服务客户数' })
  customerCount: number;
}

/**
 * 员工业绩统计响应
 */
export class EmployeePerformanceResponse {
  @ApiProperty({ description: '员工业绩列表' })
  employees: EmployeePerformanceItem[];

  @ApiProperty({ description: '汇总信息' })
  summary: {
    totalRevenue: number;
    averageRevenue: number;
    topPerformer: string;
  };
}

/**
 * 客户等级分布项
 */
export class CustomerLevelDistributionItem {
  @ApiProperty({ description: '客户等级' })
  level: string;

  @ApiProperty({ description: '数量' })
  count: number;

  @ApiProperty({ description: '占比' })
  percentage: number;

  @ApiProperty({ description: '贡献收入' })
  revenue: number;
}

/**
 * 客户等级分布详情
 */
export class CustomerLevelDetail {
  @ApiProperty({ description: '客户等级' })
  level: string;

  @ApiProperty({ description: '客户列表' })
  customers: Array<{
    customerId: number;
    companyName: string;
    unifiedSocialCreditCode: string;
    contributionAmount: number;
  }>;
}

/**
 * 客户等级分布统计响应
 */
export class CustomerLevelDistributionResponse {
  @ApiProperty({ description: '等级分布统计' })
  distribution: CustomerLevelDistributionItem[];

  @ApiProperty({ description: '详细信息' })
  details: CustomerLevelDetail[];

  @ApiProperty({ description: '汇总信息' })
  summary: {
    totalCustomers: number;
    totalRevenue: number;
  };
}

/**
 * 客户流失统计项
 */
export class CustomerChurnStatsItem {
  @ApiProperty({ description: '时间周期' })
  period: string;

  @ApiProperty({ description: '流失数量' })
  churnCount: number;

  @ApiProperty({ description: '流失率' })
  churnRate: number;

  @ApiProperty({ description: '流失原因分布' })
  churnReasons: Array<{
    reason: string;
    count: number;
  }>;
}

/**
 * 流失客户详情
 */
export class ChurnedCustomerItem {
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '流失日期' })
  churnDate: string;

  @ApiProperty({ description: '流失原因' })
  churnReason: string;

  @ApiProperty({ description: '最后服务日期' })
  lastServiceDate: string;
}

/**
 * 客户流失统计响应
 */
export class CustomerChurnStatsResponse {
  @ApiProperty({ description: '流失统计' })
  churnStats: CustomerChurnStatsItem[];

  @ApiProperty({ description: '流失客户详情' })
  churnedCustomers: ChurnedCustomerItem[];

  @ApiProperty({ description: '汇总信息' })
  summary: {
    totalChurned: number;
    churnRate: number;
    recoveryOpportunities: number;
  };
}

/**
 * 到期客户详情
 */
export class ExpiringCustomerItem {
  @ApiProperty({ description: '客户ID' })
  customerId: number;

  @ApiProperty({ description: '代理结束日期' })
  agencyEndDate: string;
}

/**
 * 代理服务到期客户统计响应
 */
export class ServiceExpiryStatsResponse {
  @ApiProperty({ description: '到期客户总数量' })
  totalExpiredCustomers: number;

  @ApiProperty({ description: '到期客户列表' })
  expiredCustomers: ExpiringCustomerItem[];
}

/**
 * 会计负责客户统计项
 */
export class AccountantClientStatsItem {
  @ApiProperty({ description: '会计姓名' })
  accountantName: string;

  @ApiProperty({ description: '会计类型：consultantAccountant-顾问会计，bookkeepingAccountant-记账会计，invoiceOfficer-开票员' })
  accountantType: 'consultantAccountant' | 'bookkeepingAccountant' | 'invoiceOfficer';

  @ApiProperty({ description: '负责的客户数量' })
  clientCount: number;

  @ApiProperty({ description: '部门' })
  department?: string;
}

/**
 * 会计负责客户统计响应
 */
export class AccountantClientStatsResponse {
  @ApiProperty({ description: '会计统计列表' })
  accountants: AccountantClientStatsItem[];
} 