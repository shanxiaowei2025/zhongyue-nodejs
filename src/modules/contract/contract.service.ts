import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { ContractPermissionService } from './services/contract-permission.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    private readonly contractPermissionService: ContractPermissionService,
  ) {}

  // 创建合同
  async create(createContractDto: CreateContractDto, userId: number, username: string): Promise<Contract> {
    // 检查用户是否有权限创建合同
    const canCreate = await this.contractPermissionService.canCreate(userId);
    if (!canCreate) {
      throw new ForbiddenException('您没有创建合同的权限');
    }

    const contract = this.contractRepository.create({
      ...createContractDto,
      submitter: username,
      contractStatus: '0', // 初始状态为未签署
    });

    // 如果有甲方签订日期，则生成合同编号
    if (contract.partyASignDate) {
      try {
        contract.contractNumber = await this.generateContractNumber(contract.partyASignDate);
        this.logger.debug(`生成合同编号: ${contract.contractNumber}, 甲方签订日期: ${contract.partyASignDate}`);
      } catch (error) {
        this.logger.error('生成合同编号出错:', error);
        throw new BadRequestException('生成合同编号失败: ' + error.message);
      }
    }

    return await this.contractRepository.save(contract);
  }

  // 格式化日期为YYYYMMDD格式的字符串
  private formatDateToString(date: Date | string): string {
    if (!date) return '';
    
    try {
      // 如果是Date对象
      if (date instanceof Date) {
        return date.toISOString().slice(0, 10).replace(/-/g, '');
      }
      
      // 如果是字符串格式的日期
      if (typeof date === 'string') {
        // 处理不同格式的日期字符串
        if (date.includes('T')) {
          // ISO格式: "2023-05-26T14:30:00.000Z"
          return date.split('T')[0].replace(/-/g, '');
        } else if (date.includes('-')) {
          // 标准日期格式: "2023-05-26"
          return date.replace(/-/g, '');
        } else if (date.length === 8 && /^\d{8}$/.test(date)) {
          // 已经是YYYYMMDD格式
          return date;
        }
      }
      
      // 尝试创建新的Date对象并格式化
      const newDate = new Date(date);
      if (!isNaN(newDate.getTime())) {
        return newDate.toISOString().slice(0, 10).replace(/-/g, '');
      }
      
      throw new Error(`无法解析日期: ${date}`);
    } catch (error) {
      this.logger.error(`日期格式化错误: ${error.message}`);
      throw error;
    }
  }

  // 生成合同编号（类似收据编号，但最后部分是5位）
  private async generateContractNumber(signDate: Date | string): Promise<string> {
    if (!signDate) {
      throw new Error('甲方签订日期不能为空');
    }
    
    // 格式化日期为YYYYMMDD
    const datePart = this.formatDateToString(signDate);
    
    // 确保得到的datePart是8位数字
    if (!/^\d{8}$/.test(datePart)) {
      throw new Error(`日期格式不正确: ${signDate}, 格式化结果: ${datePart}`);
    }
    
    this.logger.debug('生成合同编号 - 日期部分:', datePart);
    
    // 查询当天最大的合同编号
    const query = `
      SELECT contractNumber 
      FROM sys_contract 
      WHERE DATE(partyASignDate) = DATE(?) 
      AND contractNumber IS NOT NULL 
      AND contractNumber LIKE '${datePart}%'
      ORDER BY contractNumber DESC 
      LIMIT 1
    `;
    
    this.logger.debug('执行查询:', query, '参数:', signDate);
    const result = await this.contractRepository.query(query, [signDate]);
    this.logger.debug('查询结果:', result);
    
    let sequenceNumber = 1;
    if (result && result.length > 0 && result[0].contractNumber) {
      // 提取序列号部分并加1
      const lastContractNumber = result[0].contractNumber;
      this.logger.debug('找到最后的合同编号:', lastContractNumber);
      
      // 确保contractNumber至少有9个字符（8位日期+至少1位序号）
      if (lastContractNumber.length >= 9) {
        const lastNumber = parseInt(lastContractNumber.substring(8), 10);
        if (!isNaN(lastNumber)) {
          sequenceNumber = lastNumber + 1;
          this.logger.debug('新序列号:', sequenceNumber);
        } else {
          this.logger.error('无法解析序列号部分:', lastContractNumber.substring(8));
        }
      } else {
        this.logger.error('合同编号格式不正确:', lastContractNumber);
      }
    } else {
      this.logger.debug('没有找到现有合同编号，使用序列号1');
    }
    
    // 格式化序列号为5位（合同编号最后5位）
    const sequencePart = String(sequenceNumber).padStart(5, '0');
    
    const contractNumber = `${datePart}${sequencePart}`;
    this.logger.debug('生成的完整合同编号:', contractNumber);
    
    return contractNumber;
  }

  // 检查并更新委托到期的合同状态
  private async checkAndUpdateExpiredContracts(contracts: Contract[]): Promise<Contract[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天的00:00:00
    
    const contractsToUpdate = [];
    
    // 检查每个合同的委托结束日期
    for (const contract of contracts) {
      if (contract.entrustmentEndDate && contract.contractStatus !== '2') {
        // 确保比较的是日期而不是时间
        const endDate = new Date(contract.entrustmentEndDate);
        endDate.setHours(0, 0, 0, 0);
        
        // 如果今天已经超过了委托结束日期，则标记为过期
        if (today > endDate) {
          this.logger.debug(`合同 #${contract.id} 委托已到期，委托结束日期: ${endDate.toISOString().split('T')[0]}, 当前状态: ${contract.contractStatus}`);
          contract.contractStatus = '2'; // 更新为已终止状态
          contractsToUpdate.push(contract);
        }
      }
    }
    
    // 批量更新过期合同的状态
    if (contractsToUpdate.length > 0) {
      this.logger.log(`发现 ${contractsToUpdate.length} 个委托已到期的合同，更新状态为已终止`);
      await this.contractRepository.save(contractsToUpdate);
    }
    
    return contracts;
  }

  // 查询合同列表
  async findAll(query: QueryContractDto, pagination: PaginationDto, userId: number): Promise<{ list: Contract[], total: number, currentPage: number, pageSize: number }> {
    const { page = 1, pageSize = 10 } = pagination;
    const skip = (page - 1) * pageSize;

    // 获取权限过滤条件
    const permissionFilter = await this.contractPermissionService.buildContractQueryFilter(userId);
    const where: FindOptionsWhere<Contract> | FindOptionsWhere<Contract>[] = Array.isArray(permissionFilter)
      ? permissionFilter.map(filter => ({ ...filter }))
      : { ...permissionFilter };

    // 处理查询条件
    const addConditions = (conditions: any) => {
      if (query.contractNumber) {
        conditions.contractNumber = Like(`%${query.contractNumber}%`);
      }
      if (query.partyACompany) {
        conditions.partyACompany = Like(`%${query.partyACompany}%`);
      }
      if (query.partyACreditCode) {
        conditions.partyACreditCode = Like(`%${query.partyACreditCode}%`);
      }
      if (query.contractType) {
        conditions.contractType = query.contractType;
      }
      if (query.signatory) {
        conditions.signatory = query.signatory;
      }
      if (query.contractStatus) {
        conditions.contractStatus = query.contractStatus;
      }
      
      // 甲方签订日期范围查询
      if (query.partyASignDateStart && query.partyASignDateEnd) {
        conditions.partyASignDate = Between(
          new Date(query.partyASignDateStart),
          new Date(query.partyASignDateEnd)
        );
      } else if (query.partyASignDateStart) {
        conditions.partyASignDate = MoreThanOrEqual(new Date(query.partyASignDateStart));
      } else if (query.partyASignDateEnd) {
        conditions.partyASignDate = LessThanOrEqual(new Date(query.partyASignDateEnd));
      }
      
      // 创建时间范围查询
      if (query.createTimeStart && query.createTimeEnd) {
        conditions.createTime = Between(
          new Date(query.createTimeStart),
          new Date(query.createTimeEnd)
        );
      } else if (query.createTimeStart) {
        conditions.createTime = MoreThanOrEqual(new Date(query.createTimeStart));
      } else if (query.createTimeEnd) {
        conditions.createTime = LessThanOrEqual(new Date(query.createTimeEnd));
      }
    };

    // 根据权限过滤条件类型添加查询条件
    if (Array.isArray(where)) {
      where.forEach(condition => addConditions(condition));
    } else {
      addConditions(where);
    }

    const [contracts, total] = await this.contractRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: {
        id: 'DESC',
      },
    });

    // 检查并更新过期合同状态
    await this.checkAndUpdateExpiredContracts(contracts);

    return {
      list: contracts,
      total,
      currentPage: page,
      pageSize,
    };
  }

  // 查询单个合同详情
  async findOne(id: number, userId: number): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException(`合同 #${id} 不存在`);
    }

    // 检查用户是否有权限查看该合同
    const canView = await this.contractPermissionService.canView(id, userId);
    if (!canView) {
      throw new ForbiddenException('您没有权限查看该合同');
    }

    // 检查并更新合同委托到期状态
    if (contract.entrustmentEndDate && contract.contractStatus !== '2') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(contract.entrustmentEndDate);
      endDate.setHours(0, 0, 0, 0);
      
      if (today > endDate) {
        this.logger.debug(`合同 #${contract.id} 委托已到期，委托结束日期: ${endDate.toISOString().split('T')[0]}, 当前状态: ${contract.contractStatus}`);
        contract.contractStatus = '2'; // 更新为已终止状态
        await this.contractRepository.save(contract);
      }
    }

    return contract;
  }

  // 更新合同
  async update(id: number, updateContractDto: UpdateContractDto, userId: number): Promise<Contract> {
    // 先查询合同是否存在
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException(`合同 #${id} 不存在`);
    }

    // 检查用户是否有权限更新该合同
    const canUpdate = await this.contractPermissionService.canUpdate(id, userId);
    if (!canUpdate) {
      throw new ForbiddenException('您没有权限更新该合同');
    }

    // 检查甲方签订日期是否有变更
    let needUpdateContractNumber = false;
    
    if (updateContractDto.partyASignDate !== undefined) {
      // 确保两个日期的格式一致后再比较
      const oldDateStr = this.formatDateToString(contract.partyASignDate);
      const newDateStr = this.formatDateToString(updateContractDto.partyASignDate);
      
      this.logger.debug('更新甲方签订日期 - 旧日期:', oldDateStr, '新日期:', newDateStr);
      
      needUpdateContractNumber = oldDateStr !== newDateStr;
      this.logger.debug('需要更新合同编号:', needUpdateContractNumber);
    }

    // 创建更新对象，避免直接修改DTO
    const updateData = { ...updateContractDto };
    
    // 如果甲方签订日期变更，重新生成合同编号
    if (needUpdateContractNumber && updateContractDto.partyASignDate) {
      try {
        updateData['contractNumber'] = await this.generateContractNumber(updateContractDto.partyASignDate);
        this.logger.debug(`更新后的合同编号: ${updateData['contractNumber']}`);
      } catch (error) {
        this.logger.error('更新合同编号出错:', error);
        throw new BadRequestException('更新合同编号失败: ' + error.message);
      }
    }
    
    // 如果更新了委托结束日期，检查是否需要更新合同状态
    if (updateContractDto.entrustmentEndDate !== undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(updateContractDto.entrustmentEndDate);
      endDate.setHours(0, 0, 0, 0);
      
      // 如果今天已经超过了委托结束日期，则将状态更新为已终止
      if (today > endDate && (updateData.contractStatus === undefined || updateData.contractStatus !== '2')) {
        this.logger.debug(`更新合同 #${id} 的委托结束日期为过去日期，自动设置状态为已终止`);
        updateData.contractStatus = '2';
      }
    }
    
    // 更新合同信息
    await this.contractRepository.update(id, updateData);
    
    // 返回更新后的合同
    return this.contractRepository.findOne({ where: { id } });
  }

  // 删除合同
  async remove(id: number, userId: number): Promise<void> {
    // 先查询合同是否存在
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException(`合同 #${id} 不存在`);
    }

    // 检查用户是否有权限删除该合同
    const canDelete = await this.contractPermissionService.canDelete(id, userId);
    if (!canDelete) {
      throw new ForbiddenException('您没有权限删除该合同');
    }

    // 删除合同
    await this.contractRepository.delete(id);
  }

  // 签署合同
  async signContract(id: number, signContractDto: SignContractDto, userId: number, username: string): Promise<Contract> {
    // 先查询合同是否存在
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) {
      throw new NotFoundException(`合同 #${id} 不存在`);
    }

    // 检查合同是否已经签署
    if (contract.contractStatus === '1') {
      throw new BadRequestException('该合同已经签署，不能重复签署');
    }
    
    // 检查合同是否已经终止
    if (contract.contractStatus === '2') {
      throw new BadRequestException('该合同已经终止，不能进行签署');
    }

    // 检查委托结束日期，如果已过期则不允许签署
    if (contract.entrustmentEndDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(contract.entrustmentEndDate);
      endDate.setHours(0, 0, 0, 0);
      
      if (today > endDate) {
        throw new BadRequestException('该合同委托期限已过期，无法签署');
      }
    }

    // 更新合同签名和状态
    await this.contractRepository.update(id, {
      contractSignature: signContractDto.signature,
      contractStatus: '1', // 更新为已签署状态
    });
    
    // 返回更新后的合同
    return this.contractRepository.findOne({ where: { id } });
  }
} 