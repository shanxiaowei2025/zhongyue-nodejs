import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { FinancialSelfInspection } from './entities/financial-self-inspection.entity';
import { CreateFinancialSelfInspectionDto } from './dto/create-financial-self-inspection.dto';
import { CreateFinancialSelfInspectionRestrictedDto } from './dto/create-financial-self-inspection-restricted.dto';
import { UpdateFinancialSelfInspectionDto } from './dto/update-financial-self-inspection.dto';
import { QueryFinancialSelfInspectionDto } from './dto/query-financial-self-inspection.dto';
import { RectificationCompletionDto } from './dto/rectification-completion.dto';
import { InspectorConfirmationDto } from './dto/inspector-confirmation.dto';
import { ReviewerConfirmationDto } from './dto/reviewer-confirmation.dto';
import { ReviewerRectificationCompletionDto } from './dto/reviewer-rectification-completion.dto';
import { UpdateReviewerFieldsDto } from './dto/update-reviewer-fields.dto';
import { EmployeeService } from '../../employee/employee.service';
import { safeConvertToDate } from '../../../common/utils';

@Injectable()
export class FinancialSelfInspectionService {
  private readonly logger = new Logger(FinancialSelfInspectionService.name);

  constructor(
    @InjectRepository(FinancialSelfInspection)
    private financialSelfInspectionRepository: Repository<FinancialSelfInspection>,
    private employeeService: EmployeeService,
  ) {}

  /**
   * 创建账务自查记录
   */
  async create(createDto: CreateFinancialSelfInspectionDto | CreateFinancialSelfInspectionRestrictedDto): Promise<FinancialSelfInspection> {
    const record = this.financialSelfInspectionRepository.create(createDto);
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新账务自查记录
   * 注意：此方法仅供内部使用，不再通过API直接暴露
   */
  async update(id: number, updateDto: UpdateFinancialSelfInspectionDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 更新记录
    const updatedRecord = this.financialSelfInspectionRepository.merge(record, updateDto);
    return this.financialSelfInspectionRepository.save(updatedRecord);
  }

  /**
   * 更新整改完成日期
   */
  async updateRectificationCompletion(id: number, dto: RectificationCompletionDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 检查是否已经完成整改
    if (record.rectificationCompletionDate || record.rectificationResult) {
      throw new ForbiddenException('该账务已完成，无需重复操作');
    }

    // 更新整改完成日期
    record.rectificationCompletionDate = new Date(dto.rectificationCompletionDate);
    
    // 如果提供了整改结果，也一并更新
    if (dto.rectificationResult !== undefined) {
      record.rectificationResult = dto.rectificationResult;
    }
    
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新抽查人确认和备注
   */
  async updateInspectorConfirmation(id: number, dto: InspectorConfirmationDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
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
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    await this.financialSelfInspectionRepository.remove(record);
  }

  /**
   * 根据ID查找单个记录
   */
  async findOne(id: number): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    return record;
  }

  /**
   * 根据ID查找我提交的单个记录（带权限检查）
   */
  async findMySubmittedOne(id: number, username: string, isAdmin: boolean = false): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    
    // 权限检查：非管理员只能查看自己提交的记录
    if (!isAdmin && record.inspector !== username) {
      throw new NotFoundException(`未找到ID为${id}的记录或您没有权限查看此记录`);
    }
    
    return record;
  }

  /**
   * 根据ID查找我负责的单个记录（带权限检查）
   */
  async findMyResponsibleOne(id: number, username: string, isAdmin: boolean = false): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    
    // 权限检查：非管理员只能查看自己负责的记录
    if (!isAdmin && record.bookkeepingAccountant !== username && record.consultantAccountant !== username) {
      throw new NotFoundException(`未找到ID为${id}的记录或您没有权限查看此记录`);
    }
    
    return record;
  }

  /**
   * 查询我提交的记录（抽查人是当前用户）
   * 如果用户是管理员或超级管理员，则查看所有记录
   */
  async findMySubmitted(username: string, queryDto: QueryFinancialSelfInspectionDto, isAdmin: boolean = false) {
    const { 
      companyName, 
      unifiedSocialCreditCode, 
      bookkeepingAccountant, 
      consultantAccountant,
      inspector,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1, 
      pageSize = 10 
    } = queryDto;

    // 构建查询
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
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
        queryBuilder.andWhere('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
        hasWhereCondition = true;
      }
    }

    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
        hasWhereCondition = true;
      }
    }

    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
        hasWhereCondition = true;
      }
    }

    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
        hasWhereCondition = true;
      }
    }

    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
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
        queryBuilder.andWhere('record.inspectionDate >= :start', { start: inspectionDateStart });
      } else {
        queryBuilder.where('record.inspectionDate >= :start', { start: inspectionDateStart });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :end', { end: inspectionDateEnd });
      } else {
        queryBuilder.where('record.inspectionDate <= :end', { end: inspectionDateEnd });
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
  async findMyResponsible(username: string, queryDto: QueryFinancialSelfInspectionDto, isAdmin: boolean = false) {
    const { 
      companyName, 
      unifiedSocialCreditCode, 
      inspector,
      bookkeepingAccountant,
      consultantAccountant,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1, 
      pageSize = 10 
    } = queryDto;

    // 构建查询
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
    // 初始化一个标志，表示是否已经添加了WHERE条件
    let hasWhereCondition = false;
    
    // 如果不是管理员，则添加固定条件：记账会计或顾问会计是当前用户
    if (!isAdmin) {
      queryBuilder.where('(record.bookkeepingAccountant = :username OR record.consultantAccountant = :username)', { username });
      hasWhereCondition = true;
    }
    
    // 添加可选过滤条件，确保每个字段的过滤条件只作用于该字段
    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
        hasWhereCondition = true;
      }
    }
    
    // 其他字段的过滤条件
    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
        hasWhereCondition = true;
      }
    }
    
    if (inspector) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
        hasWhereCondition = true;
      }
    }
    
    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :accountant', { accountant: `%${bookkeepingAccountant}%` });
        hasWhereCondition = true;
      }
    }
    
    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
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
        queryBuilder.andWhere('record.inspectionDate >= :start', { start: inspectionDateStart });
      } else {
        queryBuilder.where('record.inspectionDate >= :start', { start: inspectionDateStart });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :end', { end: inspectionDateEnd });
      } else {
        queryBuilder.where('record.inspectionDate <= :end', { end: inspectionDateEnd });
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
   * 更新复查整改完成日期和结果
   */
  async updateReviewerRectificationCompletion(id: number, dto: ReviewerRectificationCompletionDto): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 检查是否已经完成复查整改
    if (record.reviewerRectificationCompletionDate || record.reviewerRectificationResult) {
      throw new ForbiddenException('该复查账务已完成，无需重复操作');
    }

    // 更新复查整改完成日期
    record.reviewerRectificationCompletionDate = new Date(dto.reviewerRectificationCompletionDate);
    
    // 如果提供了复查整改结果，也一并更新
    if (dto.reviewerRectificationResult !== undefined) {
      record.reviewerRectificationResult = dto.reviewerRectificationResult;
    }
    
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 更新复查人确认和复查备注
   */
  async updateReviewerConfirmation(id: number, dto: ReviewerConfirmationDto): Promise<FinancialSelfInspection> {
    try {
      const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
      if (!record) {
        throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
      }

      // 检查复查人是否已确认
      if (record.reviewerConfirmation) {
        throw new ForbiddenException('复查人已确认，无需重复操作');
      }

      // 记录接收到的DTO数据
      this.logger.log(`接收到的DTO数据: ${JSON.stringify(dto)}`);

      // 验证日期字段
      if (!dto.reviewerConfirmation) {
        throw new Error('复查人确认日期不能为空');
      }

      // 使用安全的日期转换函数
      const confirmationDate = safeConvertToDate(dto.reviewerConfirmation, true);
      this.logger.log(`转换后的日期: ${confirmationDate?.toISOString()}`);

      // 更新复查人确认字段
      record.reviewerConfirmation = confirmationDate;
      
      // 如果提供了复查备注，也一并更新
      if (dto.reviewerRemarks !== undefined) {
        record.reviewerRemarks = dto.reviewerRemarks;
      }
      
      return await this.financialSelfInspectionRepository.save(record);
    } catch (error) {
      this.logger.error(`更新复查人确认出错: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新复查问题和解决方案字段，同时将当前用户设置为复查人
   */
  async updateReviewerFields(id: number, updateDto: UpdateReviewerFieldsDto, username: string, isAdmin: boolean = false): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }

    // 检查当前用户是否有权限查看该记录（抽查人是否为下级）
    if (!record.inspector) {
      throw new ForbiddenException('该记录没有抽查人信息，无法处理');
    }

    // 如果不是管理员，则检查抽查人是否为下级
    if (!isAdmin) {
      const subordinates = await this.getSubordinates(username);
      if (!subordinates.includes(record.inspector)) {
        throw new ForbiddenException('您没有权限修改此记录，只能修改下级抽查人的记录');
      }
    }
    
    // 更新字段
    record.reviewerProblem = updateDto.reviewerProblem;
    record.reviewerSolution = updateDto.reviewerSolution;
    
    // 设置当前用户为复查人（如果尚未设置）
    if (!record.reviewer) {
      record.reviewer = username;
    }
    
    this.logger.log(`用户 ${username} ${isAdmin ? '(管理员)' : ''} 更新了记录ID ${id} 的复查问题和解决方案`);
    
    return this.financialSelfInspectionRepository.save(record);
  }

  /**
   * 根据ID查找我复查的单个记录（带权限检查）
   */
  async findMyReviewedOne(id: number, username: string, isAdmin: boolean = false): Promise<FinancialSelfInspection> {
    const record = await this.financialSelfInspectionRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`ID为${id}的账务自查记录不存在`);
    }
    
    // 权限检查：非管理员只能查看抽查人是自己下级的记录
    if (!isAdmin) {
      const subordinates = await this.getSubordinates(username);
      if (!subordinates.includes(record.inspector)) {
        throw new NotFoundException(`未找到ID为${id}的记录或您没有权限查看此记录`);
      }
    }
    
    return record;
  }

  /**
   * 解析职级字符串，返回主要等级和次要等级
   * @param rank 职级字符串，格式为 "Px-y"，其中 x 和 y 都是数字
   */
  private parseRank(rank: string): { mainRank: number; subRank: number } {
    if (!rank || typeof rank !== 'string') {
      return { mainRank: 0, subRank: 0 };
    }

    try {
      const parts = rank.split('-');
      if (parts.length !== 2) {
        return { mainRank: 0, subRank: 0 };
      }

      // 提取 P 后面的数字
      const mainRankStr = parts[0].replace(/\D/g, '');
      const mainRank = parseInt(mainRankStr, 10) || 0;
      
      // 提取 - 后面的数字
      const subRank = parseInt(parts[1], 10) || 0;

      return { mainRank, subRank };
    } catch (error) {
      this.logger.error(`解析职级失败: ${rank}`, error.stack);
      return { mainRank: 0, subRank: 0 };
    }
  }

  /**
   * 比较两个职级，判断是否 rank1 低于 rank2
   * @param rank1 职级1
   * @param rank2 职级2
   * @returns 如果 rank1 低于 rank2，则返回 true
   */
  private isLowerRank(rank1: string, rank2: string): boolean {
    const parsed1 = this.parseRank(rank1);
    const parsed2 = this.parseRank(rank2);

    // 首先比较主等级
    if (parsed1.mainRank < parsed2.mainRank) {
      return true;
    }

    // 如果主等级相同，比较次等级
    if (parsed1.mainRank === parsed2.mainRank && parsed1.subRank < parsed2.subRank) {
      return true;
    }

    return false;
  }

  /**
   * 获取当前用户的所有下级员工名称
   * @param username 当前用户名
   */
  private async getSubordinates(username: string): Promise<string[]> {
    try {
      // 获取当前用户信息
      const currentEmployee = await this.employeeService.findByName(username);
      
      if (!currentEmployee || !currentEmployee.rank) {
        this.logger.warn(`未找到用户 ${username} 或用户没有职级信息`);
        return [];
      }

      // 获取所有员工
      const allEmployees = await this.employeeService.findAllNoLimit();
      
      // 筛选出职级低于当前用户的员工
      const subordinates = allEmployees.filter(employee => 
        employee.name && employee.rank && 
        this.isLowerRank(employee.rank, currentEmployee.rank)
      );

      const subordinateNames = subordinates.map(emp => emp.name);
      this.logger.log(`用户 ${username}(职级:${currentEmployee.rank}) 的下级员工: ${subordinateNames.join(', ')}`);
      
      return subordinateNames;
    } catch (error) {
      this.logger.error(`获取下级员工失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 查询我复查的记录（抽查人是当前用户下级）
   * 如果用户是管理员或超级管理员，则查看所有记录
   * 否则只能查看其下级提交的记录
   */
  async findMyReviewed(username: string, queryDto: QueryFinancialSelfInspectionDto, isAdmin: boolean = false) {
    const { 
      companyName, 
      unifiedSocialCreditCode, 
      bookkeepingAccountant, 
      consultantAccountant,
      inspector,
      reviewer,
      inspectionDateStart,
      inspectionDateEnd,
      page = 1, 
      pageSize = 10 
    } = queryDto;

    // 构建查询
    const queryBuilder = this.financialSelfInspectionRepository.createQueryBuilder('record');
    
    // 初始化一个标志，表示是否已经添加了WHERE条件
    let hasWhereCondition = false;
    
    // 如果是管理员，可以查看所有记录
    if (!isAdmin) {
      // 获取当前用户的下级员工名称
      const subordinates = await this.getSubordinates(username);
      
      // 只查看下级提交的记录
      if (subordinates.length > 0) {
        queryBuilder.where('record.inspector IN (:...subordinates)', { subordinates });
        hasWhereCondition = true;
      } else {
        // 如果没有下级，则不返回任何记录
        this.logger.log(`用户 ${username} 没有下级员工，不返回任何记录`);
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }
    }
    
    // 添加可选过滤条件
    if (reviewer) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.reviewer LIKE :reviewer', { reviewer: `%${reviewer}%` });
      } else {
        queryBuilder.where('record.reviewer LIKE :reviewer', { reviewer: `%${reviewer}%` });
        hasWhereCondition = true;
      }
    }
    
    if (companyName) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
      } else {
        queryBuilder.where('record.companyName LIKE :companyName', { companyName: `%${companyName}%` });
        hasWhereCondition = true;
      }
    }

    if (unifiedSocialCreditCode) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
      } else {
        queryBuilder.where('record.unifiedSocialCreditCode LIKE :code', { code: `%${unifiedSocialCreditCode}%` });
        hasWhereCondition = true;
      }
    }

    if (bookkeepingAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.bookkeepingAccountant LIKE :bookkeeper', { bookkeeper: `%${bookkeepingAccountant}%` });
      } else {
        queryBuilder.where('record.bookkeepingAccountant LIKE :bookkeeper', { bookkeeper: `%${bookkeepingAccountant}%` });
        hasWhereCondition = true;
      }
    }

    if (consultantAccountant) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
      } else {
        queryBuilder.where('record.consultantAccountant LIKE :consultant', { consultant: `%${consultantAccountant}%` });
        hasWhereCondition = true;
      }
    }

    if (inspector) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
      } else {
        queryBuilder.where('record.inspector LIKE :inspector', { inspector: `%${inspector}%` });
        hasWhereCondition = true;
      }
    }

    // 如果提供了抽查日期范围，添加日期过滤条件
    if (inspectionDateStart && inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate BETWEEN :startDate AND :endDate', { 
          startDate: inspectionDateStart, 
          endDate: inspectionDateEnd 
        });
      } else {
        queryBuilder.where('record.inspectionDate BETWEEN :startDate AND :endDate', { 
          startDate: inspectionDateStart, 
          endDate: inspectionDateEnd 
        });
        hasWhereCondition = true;
      }
    } else if (inspectionDateStart) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate >= :startDate', { startDate: inspectionDateStart });
      } else {
        queryBuilder.where('record.inspectionDate >= :startDate', { startDate: inspectionDateStart });
        hasWhereCondition = true;
      }
    } else if (inspectionDateEnd) {
      if (hasWhereCondition) {
        queryBuilder.andWhere('record.inspectionDate <= :endDate', { endDate: inspectionDateEnd });
      } else {
        queryBuilder.where('record.inspectionDate <= :endDate', { endDate: inspectionDateEnd });
        hasWhereCondition = true;
      }
    }

    // 添加分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 添加排序，按创建时间倒序排列
    queryBuilder.orderBy('record.createdAt', 'DESC');

    // 查询数据和计算总数
    const [items, total] = await queryBuilder.getManyAndCount();

    // 返回分页数据
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
} 