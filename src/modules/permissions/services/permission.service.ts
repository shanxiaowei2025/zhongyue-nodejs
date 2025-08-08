import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';
import {
  UpdatePermissionDto,
  GetPermissionsQueryDto,
} from '../dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  //   async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
  //     // 查找角色
  //     const role = await this.roleRepository.findOneBy({ id: createPermissionDto.role_id });
  //     if (!role) {
  //       throw new NotFoundException(`角色ID为${createPermissionDto.role_id}的记录不存在`);
  //     }

  //     // 检查权限是否已存在
  //     const existingPermission = await this.permissionRepository.findOne({
  //       where: {
  //         role: { id: role.id },
  //         permission_name: createPermissionDto.permission_name
  //       }
  //     });

  //     if (existingPermission) {
  //       throw new BadRequestException(`该角色已存在权限：${createPermissionDto.permission_name}`);
  //     }

  //     // 创建权限
  //     const permission = this.permissionRepository.create({
  //       role,
  //       role_name: role.name,
  //       page_name: createPermissionDto.page_name,
  //       permission_name: createPermissionDto.permission_name,
  //       permission_value: createPermissionDto.permission_value,
  //       description: createPermissionDto.description
  //     });

  //     return this.permissionRepository.save(permission);
  //   }

  //   async batchCreate(batchDto: BatchCreatePermissionDto): Promise<Permission[]> {
  //     const permissions: Permission[] = [];

  //     for (const dto of batchDto.permissions) {
  //       const role = await this.roleRepository.findOneBy({ id: dto.role_id });
  //       if (!role) {
  //         throw new NotFoundException(`角色ID为${dto.role_id}的记录不存在`);
  //       }

  //       const permission = this.permissionRepository.create({
  //         role,
  //         role_name: role.name,
  //         page_name: dto.page_name,
  //         permission_name: dto.permission_name,
  //         permission_value: dto.permission_value,
  //         description: dto.description
  //       });

  //       permissions.push(permission);
  //     }

  //     return this.permissionRepository.save(permissions);
  //   }

  async findAll(query?: GetPermissionsQueryDto): Promise<Permission[]> {
    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.role', 'role');

    if (query?.role_id) {
      queryBuilder.andWhere('role.id = :roleId', { roleId: query.role_id });
    }

    if (query?.page_name) {
      queryBuilder.andWhere('permission.page_name = :pageName', {
        pageName: query.page_name,
      });
    }

    return queryBuilder
      .orderBy('permission.page_name', 'ASC')
      .addOrderBy('permission.permission_name', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!permission) {
      throw new NotFoundException(`权限ID为${id}的记录不存在`);
    }

    return permission;
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    // 只更新权限值
    permission.permission_value = updatePermissionDto.permission_value;

    return this.permissionRepository.save(permission);
  }

  //   async remove(id: number): Promise<void> {
  //     const permission = await this.findOne(id);
  //     await this.permissionRepository.remove(permission);
  //   }

  // 获取按页面分组的权限列表
  async getPermissionsByPage(): Promise<Record<string, Permission[]>> {
    const permissions = await this.permissionRepository.find({
      order: {
        page_name: 'ASC',
        permission_name: 'ASC',
      },
    });

    const result: Record<string, Permission[]> = {};

    permissions.forEach((permission) => {
      if (!result[permission.page_name]) {
        result[permission.page_name] = [];
      }
      result[permission.page_name].push(permission);
    });

    return result;
  }

  // 获取所有唯一的权限定义（不重复的页面名+权限名+描述组合）
  async getUniquePermissions(): Promise<
    Array<{ page_name: string; permission_name: string; description: string }>
  > {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .select([
        'permission.page_name',
        'permission.permission_name',
        'permission.description',
      ])
      .groupBy('permission.page_name')
      .addGroupBy('permission.permission_name')
      .addGroupBy('permission.description')
      .getRawMany();

    return permissions.map((p) => ({
      page_name: p.permission_page_name,
      permission_name: p.permission_permission_name,
      description: p.permission_description,
    }));
  }

  /**
   * 根据角色名称和权限名称获取权限值
   * @param role_name 角色名称
   * @param permission_name 权限名称
   * @returns 权限值布尔值和权限信息
   */
  async getPermissionValueByName(
    role_name: string,
    permission_name: string,
  ): Promise<{
    permission_value: boolean;
    permission?: Permission;
  }> {
    try {
      console.log(
        `查询权限: role_name=${role_name}, permission_name=${permission_name}`,
      ); // 添加日志

      // 使用 QueryBuilder 构建更清晰的查询
      const permission = await this.permissionRepository
        .createQueryBuilder('permission')
        .where('permission.role_name = :roleName', { roleName: role_name })
        .andWhere('permission.permission_name = :permName', {
          permName: permission_name,
        })
        .getOne();

      if (!permission) {
        console.log('未找到匹配的权限记录');
        return { permission_value: false };
      }

      console.log(
        `找到权限记录: id=${permission.id}, value=${permission.permission_value}`,
      );
      return {
        permission_value: permission.permission_value,
        permission,
      };
    } catch (error) {
      console.error('获取权限值失败:', error);
      return { permission_value: false };
    }
  }
}
