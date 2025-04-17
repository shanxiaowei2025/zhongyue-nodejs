import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { initialPermissions } from '../data/initial-permissions';
import { RoleService } from '../../roles/services/role.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionInitService implements OnModuleInit {
  private readonly logger = new Logger(PermissionInitService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async onModuleInit() {
    // 等待角色和用户初始化完成后再初始化权限
    setTimeout(async () => {
      await this.initPermissions();
    }, 3000); // 增加延迟，确保前面的初始化已完成
  }

  private async initPermissions() {
    try {
      // 检查是否已有权限数据
      const existingPermissions = await this.permissionService.getUniquePermissions();
      
      // 检查是否有超级管理员用户
      const adminUser = await this.userRepository.findOne({
        where: { username: '超级管理员' },
      });
      
      if (!adminUser) {
        this.logger.warn('超级管理员用户不存在，权限初始化暂停');
        return;
      }
      
      if (existingPermissions.length === 0) {
        this.logger.log('初始化权限数据...');
        
        // 获取所有角色
        const roles = await this.roleService.findAll();
        
        if (roles.length === 0) {
          this.logger.warn('没有找到角色数据，权限初始化将在角色创建后执行');
          return;
        }
        
        // 为每个角色创建默认权限
        for (const role of roles) {
          this.logger.log(`为角色 "${role.name}" 创建权限...`);
          
          // 创建批量权限数据
          const permissionBatch = {
            permissions: initialPermissions.map(perm => ({
              role_id: role.id,
              page_name: perm.page_name,
              permission_name: perm.permission_name,
              description: perm.description,
              // 超级管理员默认拥有所有权限，其他角色默认无权限
              permission_value: role.code === 'super_admin'
            }))
          };
          
          // try {
          //   await this.permissionService.batchCreate(permissionBatch);
          //   this.logger.log(`为角色 "${role.name}" 创建 ${initialPermissions.length} 个权限成功`);
          // } catch (error) {
          //   this.logger.error(`为角色 "${role.name}" 创建权限失败: ${error.message}`);
          // }
        }
        
        this.logger.log('权限初始化完成');
      } else {
        this.logger.log(`已存在 ${existingPermissions.length} 个权限定义，检查是否需要添加新权限...`);
        
        // 检查是否有新增的权限定义
        const existingPermMap = new Map(existingPermissions.map(p => 
          [`${p.page_name}:${p.permission_name}`, p]
        ));
        
        const newPermissions = initialPermissions.filter(p => 
          !existingPermMap.has(`${p.page_name}:${p.permission_name}`)
        );
        
        if (newPermissions.length > 0) {
          this.logger.log(`发现 ${newPermissions.length} 个新权限定义，开始添加...`);
          
          // 获取所有角色
          const roles = await this.roleService.findAll();
          
          for (const perm of newPermissions) {
            // 为每个角色添加新权限
            for (const role of roles) {
              // try {
              //   await this.permissionService.create({
              //     role_id: role.id,
              //     page_name: perm.page_name,
              //     permission_name: perm.permission_name,
              //     description: perm.description,
              //     // 超级管理员默认拥有所有权限，其他角色默认无权限
              //     permission_value: role.code === 'super_admin'
              //   });
              // } catch (error) {
              //   this.logger.error(`为角色 "${role.name}" 添加权限 "${perm.permission_name}" 失败: ${error.message}`);
              // }
            }
            
            this.logger.log(`权限 "${perm.page_name}:${perm.permission_name}" 添加完成`);
          }
          
          this.logger.log('新权限添加完成');
        } else {
          this.logger.log('没有发现新权限定义，跳过初始化');
        }
      }
    } catch (error) {
      this.logger.error(`权限初始化过程出错: ${error.message}`);
    }
  }
}