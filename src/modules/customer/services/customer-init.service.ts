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
        dailyContact: '张三',
        dailyContactPhone: '13800138000',
        salesRepresentative: '李四',
        socialCreditCode: '91310101MA1FPX1234',
        taxBureau: '上海市浦东新区税务局',
        businessSource: '客户推荐',
        taxRegistrationType: TaxRegistrationType.GENERAL,
        chiefAccountant: '王五',
        responsibleAccountant: '赵六',
        enterpriseStatus: EnterpriseStatus.ACTIVE,
        affiliatedEnterprises: '关联企业1,关联企业2',
        mainBusiness: '软件开发、技术服务',
        bossProfile: '注重效率，关注细节',
        communicationNotes: '工作时间：9:00-18:00',
        businessScope: '计算机软件开发、技术服务、技术咨询',
        businessAddress: '上海市浦东新区张江高科技园区',
        registeredCapital: 1000000,
        establishmentDate: new Date('2020-01-01'),
        licenseExpiryDate: new Date('2040-01-01'),
        capitalContributionDeadline: new Date('2025-01-01'),
        enterpriseType: '有限责任公司',
        shareholders: '张三:60%,李四:40%',
        supervisors: '王五',
        annualInspectionPassword: '123456',
        paidInCapital: 500000,
        administrativeLicenses: '软件企业认定证书',
        capitalContributionRecords: '2020年实缴50万',
        basicBank: '中国工商银行',
        basicBankAccount: '6222021001111111111',
        basicBankNumber: '102100099996',
        generalBank: '中国建设银行',
        generalBankAccount: '6227001211111111111',
        generalBankNumber: '105100000009',
        hasOnlineBanking: '是',
        isOnlineBankingCustodian: '是',
        legalRepresentativeName: '张三',
        legalRepresentativePhone: '13800138000',
        legalRepresentativeId: '310101199001011234',
        legalRepresentativeTaxPassword: '123456',
        financialContactName: '王五',
        financialContactPhone: '13800138001',
        financialContactId: '310101199001011235',
        financialContactTaxPassword: '123456',
        taxOfficerName: '赵六',
        taxOfficerPhone: '13800138002',
        taxOfficerId: '310101199001011236',
        taxOfficerTaxPassword: '123456',
        tripartiteAgreementAccount: '6222021001111111111',
        taxCategories: '增值税、企业所得税、个人所得税',
        personalIncomeTaxStaff: '张三,李四,王五',
        personalIncomeTaxPassword: '123456',
        legalPersonIdImages: {
          front: 'https://example.com/id-front.jpg',
          back: 'https://example.com/id-back.jpg'
        },
        otherIdImages: {
          '王五': 'https://example.com/wangwu-id.jpg',
          '赵六': 'https://example.com/zhaoliu-id.jpg'
        },
        businessLicenseImages: {
          main: 'https://example.com/license.jpg'
        },
        bankAccountLicenseImages: {
          basic: 'https://example.com/basic-bank.jpg',
          general: 'https://example.com/general-bank.jpg'
        },
        supplementaryImages: {
          '其他材料': 'https://example.com/other.jpg'
        },
        submitter: '系统管理员',
        businessStatus: BusinessStatus.NORMAL,
        bossName: '张三'
      };

      const existingCustomer = await this.customerService.findAll({
        socialCreditCode: sampleCustomer.socialCreditCode
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