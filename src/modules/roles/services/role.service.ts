import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionDto } from '../dto/role.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private dataSource: DataSource,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // 检查角色名称和代码是否已存在
    const existingRole = await this.roleRepository.findOne({ 
      where: [
        { name: createRoleDto.name },
        { code: createRoleDto.code }
      ]
    });
  
    if (existingRole) {
      throw new ConflictException('角色名称或代码已存在');
    }
  
    // 使用事务来确保角色和权限的创建是原子操作
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      // 创建新角色
      const role = this.roleRepository.create({
        name: createRoleDto.name,
        code: createRoleDto.code,
        status: createRoleDto.status ?? 1,
        remark: createRoleDto.remark,
      });
  
      const savedRole = await queryRunner.manager.save(role);
  
      // 创建所有系统权限对应的记录，设置为false
      try {
        // 获取系统中所有唯一的权限定义
        const existingPermissions = await this.permissionRepository
          .createQueryBuilder('permission')
          .select([
            'permission.page_name',
            'permission.permission_name',
            'permission.description'
          ])
          .groupBy('permission.page_name')
          .addGroupBy('permission.permission_name')
          .addGroupBy('permission.description')
          .getRawMany();
  
        if (existingPermissions.length > 0) {
          // 为新角色创建所有权限记录，默认值为false
          const permissionsToInsert = existingPermissions.map(perm => 
            this.permissionRepository.create({
              role: savedRole,
              role_name: savedRole.name,
              page_name: perm.permission_page_name,
              permission_name: perm.permission_permission_name,
              permission_value: false,  // 明确设置为false
              description: perm.permission_description
            })
          );
          
          // 批量保存权限
          await queryRunner.manager.save(permissionsToInsert);
        }
      } catch (error) {
        console.error('创建默认权限失败:', error.message);
        // 记录错误但继续流程，不影响角色创建
      }
  
      await queryRunner.commitTransaction();
      
      // 返回包含权限的完整角色
      return this.findOne(savedRole.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { id: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`角色ID为${id}的记录不存在`);
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    
    // 如果更新角色名称，需要同步更新所有权限记录的角色名称
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // 更新角色基本信息
      if (updateRoleDto.name) role.name = updateRoleDto.name;
      if (updateRoleDto.code) role.code = updateRoleDto.code;
      if (updateRoleDto.status !== undefined) role.status = updateRoleDto.status;
      if (updateRoleDto.remark !== undefined) role.remark = updateRoleDto.remark;
      
      await queryRunner.manager.save(role);
      
      // 如果更新角色名称，同步更新权限记录中的角色名称
      if (updateRoleDto.name) {
        await queryRunner.manager.update(
          Permission,
          { role: { id } },
          { role_name: updateRoleDto.name }
        );
      }
      

      
      await queryRunner.commitTransaction();
      
      // 返回更新后的角色
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePermissions(id: number, updateDto: UpdateRolePermissionDto): Promise<Role> {
    const role = await this.findOne(id);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // 批量更新权限
      for (const perm of updateDto.permissions) {
        await queryRunner.manager.update(
          Permission,
          { 
            role: { id },
            page_name: perm.page_name,
            permission_name: perm.permission_name
          },
          { 
            permission_value: perm.permission_value
          }
        );
      }
      
      await queryRunner.commitTransaction();
      
      // 返回更新后的角色
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    
    // 使用事务确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // 查找所有包含此角色代码的用户
      const userRepository = this.dataSource.getRepository(User);
      const users = await userRepository
        .createQueryBuilder('user')
        .where(`JSON_CONTAINS(user.roles, :roleCode)`)
        .setParameter('roleCode', JSON.stringify(role.code))
        .getMany();
      
      // 从每个用户的角色列表中移除该角色代码
      for (const user of users) {
        user.roles = user.roles.filter(roleCode => roleCode !== role.code);
        await queryRunner.manager.save(user);
      }
      
      // 删除角色（由于设置了级联删除，权限也会自动删除）
      await queryRunner.manager.remove(role);
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 为系统添加新权限时，需要将该权限添加到所有角色
  async addNewPermissionToAllRoles(permissionData: {
    page_name: string;
    permission_name: string;
    description: string;
  }): Promise<void> {
    const roles = await this.roleRepository.find();
    
    if (roles.length === 0) return;
    
    const permissions = roles.map(role => 
      this.permissionRepository.create({
        role,
        role_name: role.name,
        page_name: permissionData.page_name,
        permission_name: permissionData.permission_name,
        permission_value: false, // 默认不赋予权限
        description: permissionData.description,
      })
    );
    
    await this.permissionRepository.save(permissions);
  }

  // 检查新权限在各角色中是否已存在
  async checkNewPermission(permissionData: {
    page_name: string;
    permission_name: string;
  }): Promise<boolean> {
    const count = await this.permissionRepository.count({
      where: {
        page_name: permissionData.page_name,
        permission_name: permissionData.permission_name
      }
    });
    
    return count > 0;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`名称为 ${name} 的角色不存在`);
    }

    return role;
  }

  async findByCode(code: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { code },
      relations: ['permissions']
    });

    if (!role) {
      throw new NotFoundException(`代码为 ${code} 的角色不存在`);
    }

    return role;
  }
} 