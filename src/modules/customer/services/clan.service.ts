import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Clan } from '../entities/clan.entity';
import { CreateClanDto } from '../dto/create-clan.dto';
import { UpdateClanDto } from '../dto/update-clan.dto';
import { QueryClanDto } from '../dto/query-clan.dto';

@Injectable()
export class ClanService {
  constructor(
    @InjectRepository(Clan)
    private readonly clanRepository: Repository<Clan>,
  ) {}

  /**
   * 创建宗族
   */
  async create(createClanDto: CreateClanDto): Promise<Clan> {
    // 检查宗族名称是否已存在
    const existingClan = await this.clanRepository.findOne({
      where: { clanName: createClanDto.clanName }
    });

    if (existingClan) {
      throw new ConflictException('宗族名称已存在');
    }

    const clan = this.clanRepository.create({
      ...createClanDto,
      memberList: createClanDto.memberList || []
    });

    return await this.clanRepository.save(clan);
  }

  /**
   * 分页查询宗族列表
   */
  async findAll(queryDto: QueryClanDto) {
    const { page = 1, pageSize = 10, clanName, memberName, exactMatch = false, namesOnly = false } = queryDto;
    
    const queryBuilder = this.clanRepository.createQueryBuilder('clan');

    // 如果只需要名称列表，只选择必要字段
    if (namesOnly) {
      queryBuilder.select(['clan.id', 'clan.clanName']);
    }

    // 宗族名称查询（支持精确匹配和模糊查询）
    if (clanName) {
      if (exactMatch) {
        queryBuilder.andWhere('clan.clanName = :clanName', { clanName });
      } else {
        queryBuilder.andWhere('clan.clanName LIKE :clanName', { 
          clanName: `%${clanName}%` 
        });
      }
    }

    // 成员姓名模糊查询
    if (memberName) {
      queryBuilder.andWhere(
        'JSON_SEARCH(clan.memberList, "one", :memberName) IS NOT NULL',
        { memberName: `%${memberName}%` }
      );
    }

    // 排序
    if (namesOnly) {
      queryBuilder.orderBy('clan.clanName', 'ASC');
    } else {
      queryBuilder.orderBy('clan.updateTime', 'DESC');
    }

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    // 如果只需要名称列表，返回简化格式
    if (namesOnly) {
      return {
        data: data.map(clan => ({
          id: clan.id,
          clanName: clan.clanName
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 根据ID查询宗族详情
   */
  async findOne(id: number): Promise<Clan> {
    const clan = await this.clanRepository.findOne({ where: { id } });
    
    if (!clan) {
      throw new NotFoundException('宗族不存在');
    }

    return clan;
  }

  /**
   * 更新宗族信息
   */
  async update(id: number, updateClanDto: UpdateClanDto): Promise<Clan> {
    const clan = await this.findOne(id);

    // 如果更新宗族名称，检查是否重复
    if (updateClanDto.clanName && updateClanDto.clanName !== clan.clanName) {
      const existingClan = await this.clanRepository.findOne({
        where: { clanName: updateClanDto.clanName }
      });

      if (existingClan) {
        throw new ConflictException('宗族名称已存在');
      }
    }

    await this.clanRepository.update(id, updateClanDto);
    return await this.findOne(id);
  }

  /**
   * 删除宗族
   */
  async remove(id: number): Promise<void> {
    const clan = await this.findOne(id);
    
    // 检查宗族是否存在成员
    if (clan.memberList && clan.memberList.length > 0) {
      throw new BadRequestException('该宗族存在成员，不可以删除');
    }
    
    await this.clanRepository.remove(clan);
  }

  /**
   * 添加成员到宗族
   */
  async addMember(id: number, memberName: string): Promise<Clan> {
    const clan = await this.findOne(id);
    
    if (!clan.memberList.includes(memberName)) {
      clan.memberList.push(memberName);
      await this.clanRepository.save(clan);
    }

    return clan;
  }

  /**
   * 从宗族中移除成员
   */
  async removeMember(id: number, memberName: string): Promise<Clan> {
    const clan = await this.findOne(id);
    
    clan.memberList = clan.memberList.filter(member => member !== memberName);
    await this.clanRepository.save(clan);

    return clan;
  }
} 