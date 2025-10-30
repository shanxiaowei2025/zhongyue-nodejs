import { Injectable, ConflictException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessOption } from './entities/business-option.entity';
import { CreateBusinessOptionDto, UpdateBusinessOptionDto, QueryBusinessOptionDto } from './dto';

/**
 * 业务选项服务类
 * 负责处理业务选项的CRUD操作和业务逻辑
 */
@Injectable()
export class BusinessOptionsService {
  private readonly logger = new Logger(BusinessOptionsService.name);

  constructor(
    @InjectRepository(BusinessOption)
    private readonly businessOptionRepository: Repository<BusinessOption>,
  ) {}

  /**
   * 创建业务选项
   * @param createDto 创建业务选项DTO
   * @param username 创建人用户名
   * @returns 创建的业务选项
   */
  async create(createDto: CreateBusinessOptionDto, username: string): Promise<BusinessOption> {
    // 验证唯一性：category + optionValue
    const existing = await this.businessOptionRepository.findOne({
      where: {
        category: createDto.category,
        optionValue: createDto.optionValue,
      },
    });

    if (existing) {
      this.logger.warn(`业务选项已存在: ${createDto.category} - ${createDto.optionValue}`);
      throw new ConflictException('该业务选项已存在');
    }

    // 创建业务选项
    const businessOption = this.businessOptionRepository.create({
      ...createDto,
      isDefault: createDto.isDefault || false,
      createdBy: username,
    });

    const savedOption = await this.businessOptionRepository.save(businessOption);
    this.logger.log(`创建业务选项成功: ID=${savedOption.id}, 类别=${savedOption.category}, 值=${savedOption.optionValue}`);
    
    return savedOption;
  }

  /**
   * 查询业务选项列表
   * @param queryDto 查询条件DTO
   * @returns 分页结果
   */
  async findAll(queryDto: QueryBusinessOptionDto) {
    const { category, isDefault, page = 1, pageSize = 10 } = queryDto;

    // 构建查询条件
    const queryBuilder = this.businessOptionRepository.createQueryBuilder('businessOption');

    if (category) {
      queryBuilder.andWhere('businessOption.category = :category', { category });
    }

    if (isDefault !== undefined && isDefault !== null) {
      queryBuilder.andWhere('businessOption.isDefault = :isDefault', { isDefault });
    }

    // 排序：按创建时间倒序（最新创建的排在前面）
    queryBuilder.orderBy('businessOption.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 执行查询
    const [list, total] = await queryBuilder.getManyAndCount();

    this.logger.log(`查询业务选项列表: 找到${total}条记录, 当前页${page}, 每页${pageSize}条`);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据类别获取业务选项
   * @param category 业务类别
   * @returns 业务选项数组
   */
  async findByCategory(category: string): Promise<BusinessOption[]> {
    const options = await this.businessOptionRepository.find({
      where: { category },
      order: {
        createdAt: 'DESC',
      },
    });

    this.logger.log(`按类别查询业务选项: 类别=${category}, 找到${options.length}条记录`);
    
    return options;
  }

  /**
   * 根据ID获取业务选项
   * @param id 业务选项ID
   * @returns 业务选项
   */
  async findOne(id: number): Promise<BusinessOption> {
    const option = await this.businessOptionRepository.findOne({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException(`业务选项不存在: ID=${id}`);
    }

    return option;
  }

  /**
   * 更新业务选项
   * @param id 业务选项ID
   * @param updateDto 更新业务选项DTO
   * @returns 更新后的业务选项
   */
  async update(id: number, updateDto: UpdateBusinessOptionDto): Promise<BusinessOption> {
    const option = await this.findOne(id);

    // 如果更新选项值,需要验证唯一性
    if (updateDto.optionValue && updateDto.optionValue !== option.optionValue) {
      const existing = await this.businessOptionRepository.findOne({
        where: {
          category: option.category,
          optionValue: updateDto.optionValue,
        },
      });

      if (existing) {
        throw new ConflictException('该业务选项值已存在');
      }
    }

    // 更新选项
    Object.assign(option, updateDto);
    const updatedOption = await this.businessOptionRepository.save(option);

    this.logger.log(`更新业务选项成功: ID=${id}`);
    
    return updatedOption;
  }

  /**
   * 删除业务选项
   * @param id 业务选项ID
   * @returns 删除结果信息
   */
  async remove(id: number) {
    const option = await this.findOne(id);

    // 不允许删除默认选项
    if (option.isDefault) {
      throw new ForbiddenException('不能删除默认选项');
    }

    // 保存删除前的信息
    const deletedInfo = {
      category: option.category,
      optionValue: option.optionValue,
    };

    await this.businessOptionRepository.remove(option);
    this.logger.log(`删除业务选项成功: ID=${id}, 类别=${option.category}, 值=${option.optionValue}`);

    return {
      message: '删除业务选项成功',
      id,
      deletedOption: deletedInfo,
    };
  }
}

