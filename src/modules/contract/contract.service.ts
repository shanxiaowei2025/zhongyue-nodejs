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
import { TokenService } from './services/token.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Expense } from '../expense/entities/expense.entity';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private readonly contractSalt: string;

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    private readonly contractPermissionService: ContractPermissionService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {
    // 从环境变量中获取合同盐值
    this.contractSalt = this.configService.get<string>('CONTRACT_SALT');
    if (!this.contractSalt) {
      const errorMessage = '环境变量CONTRACT_SALT未设置，无法初始化合同服务';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.logger.log('已加载CONTRACT_SALT环境变量');
  }

  // 创建合同
  async create(createContractDto: CreateContractDto, userId: number, username: string): Promise<Contract> {
    // 检查用户是否有权限创建合同
    const canCreate = await this.contractPermissionService.canCreate(userId);
    if (!canCreate) {
      throw new ForbiddenException('您没有创建合同的权限');
    }

    // 检查客户表中是否已存在该客户
    let customerExists = false;
    let customerInfo = null;
    let createdCustomer = null;
    let customerMessage = '';
    
    if (createContractDto.partyACompany && createContractDto.partyACreditCode) {
      // 查询条件：检查客户表中是否已有一个匹配的记录
      const querySQL = `
        SELECT * FROM sys_customer 
        WHERE companyName = ? 
        OR unifiedSocialCreditCode = ?
      `;
      
      const queryParams = [
        createContractDto.partyACompany, 
        createContractDto.partyACreditCode
      ];
      
      // 使用原生SQL查询客户表
      const queryResult = await this.contractRepository.query(querySQL, queryParams);
      
      if (queryResult && queryResult.length > 0) {
        customerInfo = queryResult[0];
        customerExists = true;
        this.logger.debug(`客户已存在: ${customerInfo.companyName}`);
      } else {
        // 如果客户不存在，则创建客户
        try {
          // 1. 准备actualResponsibles数组数据
          const actualResponsibles = [];
          if (createContractDto.partyAContact || createContractDto.partyAPhone) {
            actualResponsibles.push({
              name: createContractDto.partyAContact || '',
              phone: createContractDto.partyAPhone || ''
            });
          }
          
          // 2. 创建客户信息
          const createCustomerDto = {
            companyName: createContractDto.partyACompany,
            unifiedSocialCreditCode: createContractDto.partyACreditCode,
            registeredAddress: createContractDto.partyAAddress,
            actualResponsibles: actualResponsibles.length > 0 ? actualResponsibles : null,
            submitter: username
          };
          
          // 3. 执行创建客户的SQL
          const insertResult = await this.contractRepository.query(
            `INSERT INTO sys_customer (companyName, unifiedSocialCreditCode, registeredAddress, actualResponsibles, submitter, createTime, updateTime) 
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              createCustomerDto.companyName,
              createCustomerDto.unifiedSocialCreditCode,
              createCustomerDto.registeredAddress,
              actualResponsibles.length > 0 ? JSON.stringify(actualResponsibles) : null,
              username
            ]
          );
          
          if (insertResult && insertResult.insertId) {
            // 查询创建的客户记录
            const newCustomer = await this.contractRepository.query(
              'SELECT * FROM sys_customer WHERE id = ?',
              [insertResult.insertId]
            );
            
            if (newCustomer && newCustomer.length > 0) {
              createdCustomer = newCustomer[0];
              customerMessage = `自动创建客户: ${createdCustomer.companyName}`;
              this.logger.debug(customerMessage);
            }
          }
        } catch (error) {
          this.logger.error('创建客户失败:', error);
          // 创建客户失败不影响合同的创建
        }
      }
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

    // 保存合同并添加客户消息
    const savedContract = await this.contractRepository.save(contract);
    if (customerMessage) {
      // 添加特殊字段用于传递消息
      (savedContract as any).__customerMessage = customerMessage;
    }
    
    return savedContract;
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
      // 对所有字符串字段使用模糊查询
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
        conditions.contractType = Like(`%${query.contractType}%`);
      }
      if (query.signatory) {
        conditions.signatory = Like(`%${query.signatory}%`);
      }
      if (query.contractStatus) {
        conditions.contractStatus = Like(`%${query.contractStatus}%`);
      }
      
      // 添加新增字段的模糊查询
      if (query.contractAmount) {
        conditions.contractAmount = Like(`%${query.contractAmount}%`);
      }
      if (query.partyALegalRepresentative) {
        conditions.partyALegalRepresentative = Like(`%${query.partyALegalRepresentative}%`);
      }
      if (query.partyAContact) {
        conditions.partyAContact = Like(`%${query.partyAContact}%`);
      }
      if (query.partyAPhone) {
        conditions.partyAPhone = Like(`%${query.partyAPhone}%`);
      }
      if (query.partyAAddress) {
        conditions.partyAAddress = Like(`%${query.partyAAddress}%`);
      }
      if (query.partyBSigner) {
        conditions.partyBSigner = Like(`%${query.partyBSigner}%`);
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
      
      // 委托日期范围查询
      if (query.entrustmentStartDate) {
        conditions.entrustmentStartDate = MoreThanOrEqual(new Date(query.entrustmentStartDate));
      }
      if (query.entrustmentEndDate) {
        conditions.entrustmentEndDate = LessThanOrEqual(new Date(query.entrustmentEndDate));
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

    // 生成加密编号
    const encryptedCode = this.generateEncryptedCode(contract.contractNumber, id);

    // 更新合同签名、状态和加密编号
    await this.contractRepository.update(id, {
      contractSignature: signContractDto.signature,
      contractStatus: '1', // 更新为已签署状态
      encryptedCode: encryptedCode // 添加加密编号
    });
    
    // 签署完成后，删除该合同的所有token
    try {
      await this.tokenService.deleteContractTokens(id);
      this.logger.debug(`合同 #${id} 签署完成，已删除所有相关令牌`);
    } catch (error) {
      this.logger.error(`删除合同 #${id} 的令牌失败: ${error.message}`, error.stack);
      // 不影响主流程，继续返回
    }
    
    // 返回更新后的合同
    return this.contractRepository.findOne({ where: { id } });
  }

  /**
   * 生成加密编号
   * @param contractNumber 合同编号
   * @param id 合同ID
   * @returns 加密后的字符串
   */
  private generateEncryptedCode(contractNumber: string, id: number): string {
    // 使用环境变量中的盐值进行加密
    const rawData = `${contractNumber || ''}${id}`;
    
    // 使用SHA-256算法进行加密
    const hash = crypto.createHmac('sha256', this.contractSalt)
                      .update(rawData)
                      .digest('hex');
    
    // 取前16位，使结果更短且易于使用
    return hash.substring(0, 16).toUpperCase();
  }

  /**
   * 保存合同签名图片（不受权限限制，通过token验证）
   * @param contractId 合同ID
   * @param signatureUrl 签名图片链接
   */
  async saveContractSignature(contractId: number, signatureUrl: string): Promise<boolean> {
    try {
      // 验证合同是否存在
      const contract = await this.contractRepository.findOne({ where: { id: contractId } });
      if (!contract) {
        this.logger.warn(`保存签名失败: 合同 #${contractId} 不存在`);
        return false;
      }

      // 验证合同状态
      if (contract.contractStatus === '2') {
        this.logger.warn(`保存签名失败: 合同 #${contractId} 已终止`);
        return false;
      }
      
      // 生成加密编号
      const encryptedCode = this.generateEncryptedCode(contract.contractNumber, contractId);
      
      // 更新合同签名、状态和加密编号
      await this.contractRepository.update(contractId, {
        contractSignature: signatureUrl,
        contractStatus: '1', // 更新为已签署状态
        encryptedCode: encryptedCode // 添加加密编号
      });
      
      this.logger.debug(`合同 #${contractId} 签名已更新，状态已设置为已签署`);
      
      // 签署完成后，删除该合同的所有token
      try {
        await this.tokenService.deleteContractTokens(contractId);
        this.logger.debug(`合同 #${contractId} 签署完成，已删除所有相关令牌`);
      } catch (error) {
        this.logger.error(`删除合同 #${contractId} 的令牌失败: ${error.message}`, error.stack);
        // 不影响主流程，继续返回
      }
      
      return true;
    } catch (error) {
      this.logger.error(`保存合同签名失败: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 根据加密编号获取合同图片
   * @param encryptedCode 合同加密编号
   * @returns 合同图片URL或null
   */
  async getContractImageByEncryptedCode(encryptedCode: string): Promise<{ contractImage: string }> {
    this.logger.debug(`通过加密编号查询合同: ${encryptedCode}`);
    
    // 查询合同
    const contract = await this.contractRepository.findOne({ 
      where: { encryptedCode },
      select: ['id', 'contractImage', 'contractNumber'] 
    });
    
    if (!contract) {
      throw new NotFoundException(`未找到该加密编号对应的合同`);
    }
    
    this.logger.debug(`找到合同 #${contract.id}, 合同编号: ${contract.contractNumber}`);
    
    // 返回合同图片URL
    return { contractImage: contract.contractImage };
  }

  /**
   * 获取合同的加密编号
   * @param contractId 合同ID
   * @returns 合同的加密编号或null
   */
  async getContractEncryptedCode(contractId: number): Promise<string | null> {
    try {
      const contract = await this.contractRepository.findOne({ 
        where: { id: contractId },
        select: ['encryptedCode']
      });
      
      return contract ? contract.encryptedCode : null;
    } catch (error) {
      this.logger.error(`获取合同加密编号失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 更新合同图片
   * @param contractId 合同ID
   * @param contractImage 合同图片文件名
   * @returns 更新是否成功
   */
  async updateContractImage(contractId: number, contractImage: string): Promise<boolean> {
    try {
      // 验证合同是否存在
      const contract = await this.contractRepository.findOne({ where: { id: contractId } });
      if (!contract) {
        this.logger.warn(`更新合同图片失败: 合同 #${contractId} 不存在`);
        return false;
      }

      // 更新合同图片
      await this.contractRepository.update(contractId, { contractImage });
      
      this.logger.debug(`合同 #${contractId} 图片已更新为: ${contractImage}`);
      
      return true;
    } catch (error) {
      this.logger.error(`更新合同图片失败: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 计算指定日期的下个月
   * @param dateString 日期字符串
   * @returns 下个月的日期字符串 (YYYY-MM-DD)
   */
  private getNextMonth(dateString: string): string {
    try {
      // 确保是字符串类型
      const dateStr = String(dateString);
      this.logger.debug(`正在处理日期(下个月): ${dateStr}`);

      // 创建日期对象
      const date = new Date(dateStr);
      
      // 验证日期是否有效
      if (isNaN(date.getTime())) {
        this.logger.error(`无效的日期字符串: ${dateStr}`);
        return '';
      }
      
      this.logger.debug(`原始日期对象: ${date.toISOString()}`);
      
      // 获取年、月、日
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      // 创建新的日期对象，设置为下个月同一天
      const nextMonth = new Date(year, month + 1, day);
      
      // 处理月末问题（例如1月31日的下个月应该是2月28/29日）
      // 如果计算的下个月日期的月份不是期望的月份+1，说明发生了溢出
      // 例如：3月31日 + 1个月 = 5月1日（错误，应该是4月30日）
      if (nextMonth.getMonth() !== (month + 1) % 12) {
        // 设置为该月的最后一天
        nextMonth.setDate(0); // 设置为上个月的最后一天
      }
      
      this.logger.debug(`计算得到的下个月: ${nextMonth.toISOString()}`);
      
      // 格式化为YYYY-MM-DD格式
      const nextYear = nextMonth.getFullYear();
      const nextMonthNum = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const nextDayOfMonth = String(nextMonth.getDate()).padStart(2, '0');
      
      const result = `${nextYear}-${nextMonthNum}-${nextDayOfMonth}`;
      this.logger.debug(`格式化后的结果: ${result}`);
      
      return result;
    } catch (error) {
      this.logger.error(`日期处理出错: ${error.message}`);
      return '';
    }
  }

  // 获取代理日期数据
  async getAgencyDates(companyName?: string, unifiedSocialCreditCode?: string): Promise<{ agencyStartDate: string }> {
    this.logger.debug(`请求获取代理日期 - 原始参数: companyName='${companyName}', unifiedSocialCreditCode='${unifiedSocialCreditCode}'`);
    
    // 检查是否至少提供了一个查询参数
    if (!companyName && !unifiedSocialCreditCode) {
      this.logger.warn('获取代理日期请求未提供任何查询参数');
      throw new BadRequestException('必须提供企业名称或统一社会信用代码');
    }

    try {
      // 优先使用统一社会信用代码，如果没有则使用公司名称
      let params: any[] = [];
      let whereClause: string = '';
      
      if (unifiedSocialCreditCode && unifiedSocialCreditCode.trim() !== '') {
        whereClause = 'partyACreditCode = ?';
        params.push(unifiedSocialCreditCode.trim());
        this.logger.debug(`使用统一社会信用代码查询: '${unifiedSocialCreditCode.trim()}'`);
      } else if (companyName && companyName.trim() !== '') {
        whereClause = 'partyACompany = ?';
        params.push(companyName.trim());
        this.logger.debug(`使用企业名称查询: '${companyName.trim()}'`);
      } else {
        this.logger.warn('查询参数为空或只包含空格');
        throw new BadRequestException('查询参数不能为空');
      }
      
      // 确保参数不包含NaN
      if (params.some(param => param === 'NaN' || Number.isNaN(param))) {
        this.logger.warn(`查询参数中包含NaN值: [${params.join(', ')}]`);
        throw new BadRequestException('查询参数无效');
      }
      
      // 执行查询，获取代理记账合同且状态为已签署的记录，按委托结束日期降序排序
      const query = `
        SELECT entrustmentStartDate, entrustmentEndDate FROM sys_contract
        WHERE ${whereClause}
        AND contractType = '代理记账合同'
        AND contractStatus = '1'
        ORDER BY entrustmentEndDate DESC
        LIMIT 1
      `;

      this.logger.debug(`执行查询SQL: ${query}`);
      this.logger.debug(`查询参数: [${params.join(', ')}]`);
      
      // 执行原生SQL查询
      const result = await this.contractRepository.query(query, params);
      
      // 检查是否找到结果
      if (!result || result.length === 0) {
        this.logger.warn(`未找到符合条件的代理记账合同记录 - 查询条件: ${whereClause}, 参数: [${params.join(', ')}]`);
        throw new NotFoundException('未找到符合条件的代理记账合同记录');
      }
      
      this.logger.debug(`查询结果: ${JSON.stringify(result[0])}`);
      
      // 确保返回的日期字段存在
      if (!result[0].entrustmentStartDate || !result[0].entrustmentEndDate) {
        this.logger.warn(`查询结果缺少日期字段: ${JSON.stringify(result[0])}`);
        throw new BadRequestException('合同日期数据不完整');
      }
      
      // 计算委托结束日期的下个月
      const nextMonthDate = this.getNextMonth(result[0].entrustmentEndDate);
      if (!nextMonthDate) {
        throw new BadRequestException('无法计算委托结束日期的下个月');
      }
      
      // 只返回agencyStartDate字段
      return {
        agencyStartDate: nextMonthDate // 使用委托结束日期的下个月作为开始日期
      };
    } catch (error) {
      this.logger.error(`获取代理日期失败: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`获取代理日期失败: ${error.message}`);
    }
  }
} 