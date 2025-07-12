import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { FinancialSelfInspection } from './entities/financial-self-inspection.entity';
import { CreateFinancialSelfInspectionDto } from './dto/create-financial-self-inspection.dto';
import { CreateFinancialSelfInspectionRestrictedDto } from './dto/create-financial-self-inspection-restricted.dto';
import { UpdateFinancialSelfInspectionDto } from './dto/update-financial-self-inspection.dto';
import { QueryFinancialSelfInspectionDto } from './dto/query-financial-self-inspection.dto';
import { RectificationCompletionDto } from './dto/rectification-completion.dto';
import { InspectorConfirmationDto } from './dto/inspector-confirmation.dto';

@Injectable()
export class FinancialSelfInspectionService {
  constructor(
    @InjectRepository(FinancialSelfInspection)
    private financialSelfInspectionRepository: Repository<FinancialSelfInspection>,
  ) {}

  /**
   * 创建账务自查记录
   */
  async create(
    createDto:
      | CreateFinancialSelfInspectionDto
      | CreateFinancialSelfInspectionRestrictedDto,
  ): Promise<FinancialSelfInspection> {
    const record = this.financialSelfInspectionRepository.create(createDto);
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新账务自查记录
   * 注意：此方法仅供内部使用，不再通过API直接暴露
   */
  async update(
    id: number,
    updateDto: UpdateFinancialSelfInspectionDto,
  ): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 更新记录
    const updatedRecord = this.financialSelfInspectionRepository.merge(
      record,
      updateDto,
    );
    return this.financialSelfInspectionRepository.save(updatedRecord);
  }

  /**
   * 更新整改完成日期
   */
  async updateRectificationCompletion(
    id: number,
    dto: RectificationCompletionDto,
  ): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 检查是否已经完成整改
    if (record.rectificationCompletionDate || record.rectificationResult) {
      throw new ForbiddenException('该账务已完成，无需重复操作');
    }

    // 更新整改完成日期
    record.rectificationCompletionDate = new Date(
      dto.rectificationCompletionDate,
    );

    // 如果提供了整改结果，也一并更新
    if (dto.rectificationResult !== undefined) {
      record.rectificationResult = dto.rectificationResult;
    }

    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新抽查人确认和备注
   */
  async updateInspectorConfirmation(
    id: number,
    dto: InspectorConfirmationDto,
  ): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 检查抽查人是否已确认
    if (record.inspectorConfirmation) {
      throw new ForbiddenException('抽查人已确认，无需重复操作');
    }

    // 只更新抽查人确认和备注字段
    record.inspectorConfirmation = new Date(dto.inspectorConfirmation);
    if (dto.remarks !== undefined) {
      record.remarks = dto.remarks;
    }

    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 删除账务自查记录
   */
  async remove(id: number): Promise<void> {
    const record = await this.financialSelfInspectionRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    await this.financialSelfInspectionRepository.remove(record);
  }

  /**
   * 根据ID查找单个记录
   */
  async findOne(id: number): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    return record;
  }

  /**
   * 根据ID查找我提交的单个记录（带权限检查）
   */
  async findMySubmittedOne(
    id: number,
    username: string,
    isAdmin: boolean = false,
  ): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 权限检查：非管理员只能查看自己提交的记录
    if (!isAdmin && record.inspector !== username) {
      throw new NotFoundException(
        `未找到ID为${id}的记录或您没有权限查看此记录`,
      );
    }

    return record;
  }

  /**
   * 根据ID查找我负责的单个记录（带权限检查）
   */
  async findMyResponsibleOne(
    id: number,
    username: string,
    isAdmin: boolean = false,
  ): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 权限检查：非管理员只能查看自己负责的记录
    if (
      !isAdmin &&
      record.bookkeepingAccountant !== username &&
      record.consultantAccountant !== username
    ) {
      throw new NotFoundException(
        `未找到ID为${id}的记录或您没有权限查看此记录`,
      );
    }

    return record;
  }

  /**
   * 查询我提交的记录（抽查人是当前用户）
   * 如果用户是管理员或超级管理员，则查看所有记录
   */
  async findMySubmitted(
    username: string,
    queryDto: QueryFinancialSelfInspectionDto,
    isAdmin: boolean = false,
  ) {
    const {
      companyName,
      unifiedSocialCreditCode,
      bookkeepingAccountant,
      consultantAccountant,
      inspector,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1,
      pageSize = 10,
    } = queryDto;

    // 构建查询
    const queryBuilder =
      this.financialSelfInspectionRepository.createQueryBuilder('record');

    // 初始化一个标志，表示是否已经添加了WHERE条件
    let hasWhereCondition = false;

    // 如果不是管理员，则添加固定条件：抽查人是当前用户
    if (!isAdmin) {
      queryBuilder.where('record.inspector = :username', { username });
      hasWhereCondition = true;
    }

    // 添加可选过滤条件，确保每个字段的过滤条件只作用于该字段
    if (inspector && isAdmin) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspector LIKE :inspector', {
          inspector: `%${inspector}%`,
        });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', {
          inspector: `%${inspector}%`,
        });
        hasWhereCondition = true;
      }
    }

    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', {
          companyName: `%${companyName}%`,
        });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', {
          companyName: `%${companyName}%`,
        });
        hasWhereCondition = true;
      }
    }

    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', {
          code: `%${unifiedSocialCreditCode}%`,
        });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', {
          code: `%${unifiedSocialCreditCode}%`,
        });
        hasWhereCondition = true;
      }
    }

    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :accountant', {
          accountant: `%${bookkeepingAccountant}%`,
        });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :accountant', {
          accountant: `%${bookkeepingAccountant}%`,
        });
        hasWhereCondition = true;
      }
    }

    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', {
          consultant: `%${consultantAccountant}%`,
        });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', {
          consultant: `%${consultantAccountant}%`,
        });
        hasWhereCondition = true;
      }
    }

    // 日期范围查询
    if (inspectionDateStart && inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
      } else {
        queryBuilder.where('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateStart) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate >= :start', {
          start: inspectionDateStart,
        });
      } else {
        queryBuilder.where('record.inspectionDate >= :start', {
          start: inspectionDateStart,
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :end', {
          end: inspectionDateEnd,
        });
      } else {
        queryBuilder.where('record.inspectionDate <= :end', {
          end: inspectionDateEnd,
        });
        hasWhereCondition = true;
      }
    }

    // 添加分页
    queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 执行查询
    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 查询我负责的记录（记账会计或顾问会计是当前用户）
   * 如果用户是管理员或超级管理员，则查看所有记录
   */
  async findMyResponsible(
    username: string,
    queryDto: QueryFinancialSelfInspectionDto,
    isAdmin: boolean = false,
  ) {
    const {
      companyName,
      unifiedSocialCreditCode,
      inspector,
      bookkeepingAccountant,
      consultantAccountant,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1,
      pageSize = 10,
    } = queryDto;

    // 构建查询
    const queryBuilder =
      this.financialSelfInspectionRepository.createQueryBuilder('record');

    // 初始化一个标志，表示是否已经添加了WHERE条件
    let hasWhereCondition = false;

    // 如果不是管理员，则添加固定条件：记账会计或顾问会计是当前用户
    if (!isAdmin) {
      queryBuilder.where(
        '(record.bookkeepingAccountant = :username OR record.consultantAccountant = :username)',
        { username },
      );
      hasWhereCondition = true;
    }

    // 添加可选过滤条件，确保每个字段的过滤条件只作用于该字段
    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', {
          companyName: `%${companyName}%`,
        });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', {
          companyName: `%${companyName}%`,
        });
        hasWhereCondition = true;
      }
    }

    // 其他字段的过滤条件
    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', {
          code: `%${unifiedSocialCreditCode}%`,
        });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', {
          code: `%${unifiedSocialCreditCode}%`,
        });
        hasWhereCondition = true;
      }
    }

    if (inspector) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspector LIKE :inspector', {
          inspector: `%${inspector}%`,
        });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', {
          inspector: `%${inspector}%`,
        });
        hasWhereCondition = true;
      }
    }

    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :accountant', {
          accountant: `%${bookkeepingAccountant}%`,
        });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :accountant', {
          accountant: `%${bookkeepingAccountant}%`,
        });
        hasWhereCondition = true;
      }
    }

    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', {
          consultant: `%${consultantAccountant}%`,
        });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', {
          consultant: `%${consultantAccountant}%`,
        });
        hasWhereCondition = true;
      }
    }

    // 日期范围查询
    if (inspectionDateStart && inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
      } else {
        queryBuilder.where('record.inspectionDate BETWEEN :start AND :end', {
          start: inspectionDateStart,
          end: inspectionDateEnd,
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateStart) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate >= :start', {
          start: inspectionDateStart,
        });
      } else {
        queryBuilder.where('record.inspectionDate >= :start', {
          start: inspectionDateStart,
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :end', {
          end: inspectionDateEnd,
        });
      } else {
        queryBuilder.where('record.inspectionDate <= :end', {
          end: inspectionDateEnd,
        });
        hasWhereCondition = true;
      }
    }

    // 添加分页
    queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 执行查询
    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
