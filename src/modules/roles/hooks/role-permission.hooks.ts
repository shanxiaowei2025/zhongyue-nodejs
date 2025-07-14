// zhongyue-nodejs/src/modules/roles/hooks/role-permission.hooks.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { EntityManager, DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { RoleService } from '../services/role.service';

@Injectable()
export class RolePermissionHooks implements OnModuleInit, EntitySubscriberInterface<Role> {
  private readonly logger = new Logger(RolePermissionHooks.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly roleService: RoleService,
  ) {}

  // 当模块初始化时注册实体订阅器
  onModuleInit() {
    this.dataSource.subscribers.push(this);
  }

  // 指定监听的实体
  listenTo() {
    return Role;
  }

  // 角色创建后自动创建权限
  async afterInsert(event: InsertEvent<Role>): Promise<void> {
    const role = event.entity;
    if (!role) return;

    try {
      this.logger.log(`开始为角色 "${role.name}" 创建权限记录...`);
      const manager = event.manager;
      
      // 首先尝试从数据库中获取所有唯一权限
      let uniquePermissions = await manager
        .createQueryBuilder(Permission, 'permission')
        .select([
          'permission.page_name AS page_name',
          'permission.permission_name AS permission_name',
          'permission.description AS description'
        ])
        .distinct(true)
        .groupBy('permission.page_name, permission.permission_name, permission.description')
        .getRawMany();
    
      
      if (uniquePermissions.length === 0) {
        this.logger.warn('没有找到任何权限定义，无法为角色创建权限记录');
        return;
      }
      
      // 为新角色创建所有现有权限
      const permissions = uniquePermissions.map(perm => 
        manager.create(Permission, {
          role: role,
          role_name: role.name,
          page_name: perm.page_name,
          permission_name: perm.permission_name,
          // 超级管理员默认拥有所有权限，其他角色默认无权限
          permission_value: role.code === 'super_admin',
          description: perm.description,
        })
      );
      
      await manager.save(permissions);
      this.logger.log(`已为角色 "${role.name}" 创建 ${permissions.length} 个权限记录`);
    } catch (error) {
      this.logger.error(`为角色 "${role.name}" 创建权限记录时出错: ${error.message}`, error.stack);
    }
  }

  // 角色更新后同步更新权限表中的角色名称
  async afterUpdate(event: UpdateEvent<Role>): Promise<void> {
    if (!event.entity || !event.updatedColumns.find(col => col.propertyName === 'name')) {
      return;
    }
    
    try {
      const role = event.entity as Role;
      this.logger.log(`更新角色 "${role.name}" 的权限记录中的角色名称...`);
      
      // 更新权限表中的角色名称
      await event.manager.update(
        Permission,
        { role: { id: role.id } },
        { role_name: role.name }
      );
      
      this.logger.log(`角色 "${role.name}" 的权限记录已更新`);
    } catch (error) {
      this.logger.error(`更新角色权限记录时出错: ${error.message}`, error.stack);
    }
  }
}