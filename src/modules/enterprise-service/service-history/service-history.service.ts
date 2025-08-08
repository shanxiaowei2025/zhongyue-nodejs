import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceHistory } from './entities/service-history.entity';

@Injectable()
export class ServiceHistoryService {
  private readonly logger = new Logger(ServiceHistoryService.name);

  constructor(
    @InjectRepository(ServiceHistory)
    private serviceHistoryRepository: Repository<ServiceHistory>,
  ) {}

  /**
   * 创建服务历程记录
   * @param data 服务历程数据
   * @returns 创建的服务历程记录
   */
  async create(data: Partial<ServiceHistory>): Promise<ServiceHistory> {
    try {
      const serviceHistory = this.serviceHistoryRepository.create(data);
      return await this.serviceHistoryRepository.save(serviceHistory);
    } catch (error) {
      this.logger.error(`创建服务历程记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 从客户信息创建服务历程记录
   * @param customer 客户信息
   * @returns 创建的服务历程记录
   */
  async createFromCustomer(customer: any): Promise<ServiceHistory> {
    try {
      // 映射客户字段到服务历程字段
      const serviceHistoryData: Partial<ServiceHistory> = {
        companyName: customer.companyName,
        unifiedSocialCreditCode: customer.unifiedSocialCreditCode,
        consultantAccountant: customer.consultantAccountant,
        bookkeepingAccountant: customer.bookkeepingAccountant,
        invoiceOfficer: customer.invoiceOfficer,
        enterpriseStatus: customer.enterpriseStatus,
        businessStatus: customer.businessStatus,
        createdAt: customer.createTime || new Date(), // 复制客户的创建时间，若不存在则使用当前时间
        updatedAt: customer.updateTime || new Date(), // 复制客户的更新时间，若不存在则使用当前时间
      };

      return await this.create(serviceHistoryData);
    } catch (error) {
      this.logger.error(
        `从客户信息创建服务历程记录失败: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 根据企业名称或统一社会信用代码查询服务历程记录
   * @param params 查询参数，可以是企业名称或统一社会信用代码
   * @returns 处理后的服务历程记录
   */
  async findByCompanyNameOrCode(params: {
    companyName?: string;
    unifiedSocialCreditCode?: string;
  }): Promise<any[]> {
    try {
      const { companyName, unifiedSocialCreditCode } = params;

      // 构建查询条件
      const whereCondition: any = {};
      if (companyName) {
        whereCondition.companyName = companyName;
      }
      if (unifiedSocialCreditCode) {
        whereCondition.unifiedSocialCreditCode = unifiedSocialCreditCode;
      }

      // 查询指定企业的所有服务历程记录，按创建时间升序排序
      const records = await this.serviceHistoryRepository.find({
        where: whereCondition,
        order: { createdAt: 'ASC' },
      });

      if (!records || records.length === 0) {
        const searchTerm = companyName || unifiedSocialCreditCode;
        throw new NotFoundException(`未找到企业"${searchTerm}"的服务历程记录`);
      }

      // 处理记录，按照要求格式化返回数据
      const result = [];

      // 第一条记录的特殊处理
      const firstRecord = {
        id: records[0].id,
        createdAt: records[0].createdAt,
        updatedAt: records[0].updatedAt,
        updatedFields: {
          consultantAccountant: records[0].consultantAccountant,
          bookkeepingAccountant: records[0].bookkeepingAccountant,
          invoiceOfficer: records[0].invoiceOfficer,
          enterpriseStatus: records[0].enterpriseStatus,
          businessStatus: records[0].businessStatus,
        },
      };
      result.push(firstRecord);

      // 处理后续记录
      for (let i = 1; i < records.length; i++) {
        const current = records[i];
        const previous = records[i - 1];

        // 创建记录基本结构
        const formattedRecord = {
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: current.updatedAt,
          updatedFields: {},
        };

        // 检查变化的字段
        if (current.consultantAccountant !== previous.consultantAccountant) {
          formattedRecord.updatedFields['consultantAccountant'] =
            current.consultantAccountant;
        }

        if (current.bookkeepingAccountant !== previous.bookkeepingAccountant) {
          formattedRecord.updatedFields['bookkeepingAccountant'] =
            current.bookkeepingAccountant;
        }

        if (current.invoiceOfficer !== previous.invoiceOfficer) {
          formattedRecord.updatedFields['invoiceOfficer'] =
            current.invoiceOfficer;
        }

        if (current.enterpriseStatus !== previous.enterpriseStatus) {
          formattedRecord.updatedFields['enterpriseStatus'] =
            current.enterpriseStatus;
        }

        if (current.businessStatus !== previous.businessStatus) {
          formattedRecord.updatedFields['businessStatus'] =
            current.businessStatus;
        }

        result.push(formattedRecord);
      }

      return result;
    } catch (error) {
      const searchTerm = params.companyName || params.unifiedSocialCreditCode;
      this.logger.error(
        `查询企业"${searchTerm}"的服务历程记录失败: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 根据企业名称查询服务历程记录
   * @param companyName 企业名称
   * @returns 处理后的服务历程记录
   * @deprecated 请使用 findByCompanyNameOrCode 方法代替
   */
  async findByCompanyName(companyName: string): Promise<any[]> {
    return this.findByCompanyNameOrCode({ companyName });
  }
}
