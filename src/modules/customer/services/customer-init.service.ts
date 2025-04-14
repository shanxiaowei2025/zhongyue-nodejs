// 可能包含多个服务文件
// - customer-init.service.ts: 客户数据初始化服务
// - 其他特定功能的服务
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CustomerService } from '../customer.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { EnterpriseStatus, TaxRegistrationType, BusinessStatus } from '../enums/customer.enum';

@Injectable()
export class CustomerInitService implements OnModuleInit {
  private readonly logger = new Logger(CustomerInitService.name);

  constructor(private customerService: CustomerService) {}

  async onModuleInit() {
    await this.initSampleCustomer();
  }

  private async initSampleCustomer() {
    try {
      const sampleCustomer: CreateCustomerDto = {
        companyName: '示例企业有限公司',
        consultantAccountant: '王五', // 原来的chiefAccountant改为顾问会计
        bookkeepingAccountant: '赵六', // 原来的responsibleAccountant改为记账会计
        enterpriseType: '有限责任公司',
        taxNumber: '91310101MA1FPX1234', // 原来的socialCreditCode改为taxNumber
        registeredAddress: '上海市浦东新区张江高科技园区', // 新增注册地址
        businessAddress: '上海市浦东新区张江高科技园区',
        taxBureau: '上海市浦东新区税务局',
        actualResponsibleName: '张三', // 实际负责人姓名
        actualResponsiblePhone: '13800138000', // 实际负责人电话
        affiliatedEnterprises: '关联企业1,关联企业2', // 同宗企业
        bossProfile: '注重效率，关注细节', // 老板画像
        enterpriseProfile: '创新型科技企业', // 企业画像
        industryCategory: '信息技术服务业', // 行业大类
        industrySubcategory: '软件开发', // 行业细分
        hasTaxBenefits: true, // 是否有税收优惠
        businessPublicationPassword: '123456', // 原来的annualInspectionPassword改为工商公示密码
        licenseExpiryDate: new Date('2040-01-01'), // 营业执照期限
        registeredCapital: 1000000, // 注册资金
        capitalContributionDeadline: new Date('2025-01-01'), // 认缴到期日期
        paidInCapital: 500000, // 已实缴金额
        legalPersonIdImages: {
          front: 'https://example.com/id-front.jpg',
          back: 'https://example.com/id-back.jpg'
        },
        otherIdImages: {
          '财务负责人': 'https://example.com/financial-id.jpg',
          '办税员': 'https://example.com/tax-officer-id.jpg'
        },
        businessLicenseImages: {
          main: 'https://example.com/license.jpg'
        },
        bankAccountLicenseImages: {
          basic: 'https://example.com/bank-license.jpg'
        },
        supplementaryImages: {
          '其他材料': 'https://example.com/other.jpg'
        },
        administrativeLicenseType: '软件企业认定', // 行政许可类型
        administrativeLicenseExpiryDate: new Date('2025-01-01'), // 行政许可到期日期
        publicBank: '中国工商银行', // 对公开户行
        bankAccountNumber: '6222021001111111111', // 开户行账号
        publicBankOpeningDate: new Date('2020-01-01'), // 对公开户时间
        onlineBankingArchiveNumber: 'WY20210101', // 网银托管档案号
        taxReportLoginMethod: '电子税务局', // 报税登录方式
        legalRepresentativeName: '张三', // 法人姓名
        legalRepresentativePhone: '13800138000', // 法人电话
        legalRepresentativeId: '310101199001011234', // 法人身份证号
        legalRepresentativeTaxPassword: '123456', // 法人税务密码
        taxOfficerName: '赵六', // 办税员
        taxOfficerPhone: '13800138002', // 办税员电话
        taxOfficerId: '310101199001011236', // 办税员身份证号
        taxOfficerTaxPassword: '123456', // 办税员税务密码
        invoicingSoftware: '百旺税控系统', // 开票软件
        invoicingNotes: '注意开票限额', // 开票注意事项
        invoiceOfficerName: '小明', // 开票员姓名
        invoiceOfficerPhone: '13800138003', // 开票员电话
        invoiceOfficerId: '310101199001011237', // 开票员身份证号
        invoiceOfficerTaxPassword: '123456', // 开票员税务密码
        financialContactName: '王五', // 财务负责人
        financialContactPhone: '13800138001', // 财务负责人电话
        financialContactId: '310101199001011235', // 财务负责人身份证号
        financialContactTaxPassword: '123456', // 财务负责人税务密码
        taxCategories: '增值税、企业所得税、个人所得税', // 税种
        socialInsuranceTypes: '养老保险、医疗保险、失业保险', // 社保险种
        insuredPersonnel: '张三,李四,王五', // 参保人员
        tripartiteAgreementAccount: '6222021001111111111', // 三方协议扣款账户
        personalIncomeTaxPassword: '123456', // 个税密码
        personalIncomeTaxStaff: '张三,李四,王五', // 个税申报人员
        enterpriseInfoSheetNumber: 'QY20210101', // 企业信息表编号
        sealStorageNumber: 'ZB20210101', // 章存放编号
        enterpriseStatus: EnterpriseStatus.ACTIVE, // 企业当前的经营状态
        businessStatus: BusinessStatus.NORMAL, // 当前业务的状态
        submitter: '系统管理员', // 创建或最后修改该记录的用户
        remarks: '示例客户信息' // 备注信息
      };

      const existingCustomer = await this.customerService.findAll({
        keyword: sampleCustomer.companyName,
        taxNumber: sampleCustomer.taxNumber
      });

      if (existingCustomer.total === 0) {
        await this.customerService.create(sampleCustomer);
        this.logger.log('示例客户信息已初始化');
      }
    } catch (error) {
      this.logger.error('初始化示例客户信息失败', error);
    }
  }
}