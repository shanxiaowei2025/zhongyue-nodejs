import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { QueryGroupDto } from './dto/query-group.dto';
import { UpdateLastMessageDto } from './dto/update-last-message.dto';

/**
 * 群组服务类
 * 提供群组的增删查改功能
 */
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  /**
   * 创建群组
   * @param createGroupDto 创建群组数据
   * @returns 创建的群组信息
   */
  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    // 检查chatId是否已存在
    const existingGroup = await this.groupRepository.findOne({
      where: { chatId: createGroupDto.chatId },
    });

    if (existingGroup) {
      throw new ConflictException(`聊天ID "${createGroupDto.chatId}" 已存在`);
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      needAlert: createGroupDto.needAlert ?? false,
      alertLevel: createGroupDto.alertLevel ?? 0,
    });

    return await this.groupRepository.save(group);
  }

  /**
   * 查询群组列表（带分页和筛选）
   * @param queryDto 查询条件
   * @returns 群组列表和总数
   */
  async findAll(queryDto: QueryGroupDto): Promise<{
    data: Group[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      name,
      owner,
      needAlert,
      alertLevel,
      sortField = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.groupRepository.createQueryBuilder('group');

    // 构建查询条件

    if (name) {
      queryBuilder.andWhere('group.name LIKE :name', { name: `%${name}%` });
    }

    if (owner) {
      queryBuilder.andWhere('group.owner = :owner', { owner });
    }

    if (needAlert !== undefined) {
      queryBuilder.andWhere('group.needAlert = :needAlert', { needAlert });
    }

    if (alertLevel !== undefined) {
      queryBuilder.andWhere('group.alertLevel = :alertLevel', { alertLevel });
    }

    // 排序
    const validSortFields = ['id', 'chatId', 'name', 'owner', 'needAlert', 'alertLevel', 'createdAt', 'updatedAt'];
    const finalSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
    queryBuilder.orderBy(`group.${finalSortField}`, sortOrder);

    // 分页
    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 根据ID查询单个群组
   * @param id 群组ID
   * @returns 群组信息
   */
  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`ID为 ${id} 的群组不存在`);
    }

    return group;
  }

  /**
   * 根据聊天ID查询群组
   * @param chatId 聊天ID
   * @returns 群组信息
   */
  async findByChatId(chatId: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { chatId },
    });

    if (!group) {
      throw new NotFoundException(`聊天ID为 "${chatId}" 的群组不存在`);
    }

    return group;
  }

  /**
   * 更新群组信息
   * @param id 群组ID
   * @param updateGroupDto 更新数据
   * @returns 更新后的群组信息
   */
  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    // 如果要更新chatId，检查新的chatId是否已存在
    if (updateGroupDto.chatId && updateGroupDto.chatId !== group.chatId) {
      const existingGroup = await this.groupRepository.findOne({
        where: { chatId: updateGroupDto.chatId },
      });

      if (existingGroup) {
        throw new ConflictException(`聊天ID "${updateGroupDto.chatId}" 已存在`);
      }
    }

    Object.assign(group, updateGroupDto);
    return await this.groupRepository.save(group);
  }

  /**
   * 删除群组
   * @param id 群组ID
   * @returns 删除结果
   */
  async remove(id: number): Promise<{ message: string }> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
    return { message: `群组 "${group.name}" 已成功删除` };
  }

  /**
   * 批量删除群组
   * @param ids 群组ID数组
   * @returns 删除结果
   */
  async removeMany(ids: number[]): Promise<{ message: string; deletedCount: number }> {
    if (!ids || ids.length === 0) {
      throw new ConflictException('请提供要删除的群组ID');
    }

    const groups = await this.groupRepository.find({
      where: { id: In(ids) },
    });
    
    if (groups.length === 0) {
      throw new NotFoundException('没有找到要删除的群组');
    }

    await this.groupRepository.remove(groups);
    
    return {
      message: `成功删除 ${groups.length} 个群组`,
      deletedCount: groups.length,
    };
  }

  /**
   * 更新群组的最后消息
   * @param id 群组ID
   * @param messageData 消息数据
   * @param messageType 消息类型
   * @returns 更新后的群组信息
   */
  async updateLastMessage(
    id: number,
    messageData: UpdateLastMessageDto,
    messageType: 'general' | 'employee' | 'customer' = 'general'
  ): Promise<Group> {
    const group = await this.findOne(id);

    switch (messageType) {
      case 'employee':
        group.lastEmployeeMessage = messageData;
        break;
      case 'customer':
        group.lastCustomerMessage = messageData;
        break;
      default:
        group.lastMessage = messageData;
        break;
    }

    return await this.groupRepository.save(group);
  }

  /**
   * 更新群组提醒设置
   * @param id 群组ID
   * @param needAlert 是否需要提醒
   * @param alertLevel 提醒级别
   * @returns 更新后的群组信息
   */
  async updateAlertSettings(
    id: number,
    needAlert: boolean,
    alertLevel?: number
  ): Promise<Group> {
    const group = await this.findOne(id);
    
    group.needAlert = needAlert;
    if (alertLevel !== undefined) {
      group.alertLevel = alertLevel;
    }

    return await this.groupRepository.save(group);
  }

  /**
   * 获取需要提醒的群组列表
   * @param alertLevel 可选的提醒级别筛选
   * @returns 需要提醒的群组列表
   */
  async getGroupsNeedingAlert(alertLevel?: number): Promise<Group[]> {
    const queryBuilder = this.groupRepository.createQueryBuilder('group')
      .where('group.needAlert = :needAlert', { needAlert: true });

    if (alertLevel !== undefined) {
      queryBuilder.andWhere('group.alertLevel = :alertLevel', { alertLevel });
    }

    return await queryBuilder.getMany();
  }
} 