import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoleService } from './role.service';
import { initialRoles } from '../data/initial-roles';

@Injectable()
export class RoleInitService implements OnModuleInit {
  private readonly logger = new Logger(RoleInitService.name);

  constructor(private readonly roleService: RoleService) {}

  async onModuleInit() {
    await this.initRoles();
  }

  private async initRoles() {
    try {
      const existingRoles = await this.roleService.findAll();
      
      if (existingRoles.length === 0) {
        this.logger.log('初始化角色数据...');
        
        for (const roleData of initialRoles) {
          try {
            await this.roleService.create(roleData);
            this.logger.log(`角色 "${roleData.name}" 创建成功`);
          } catch (error) {
            this.logger.error(`角色 "${roleData.name}" 创建失败: ${error.message}`);
          }
        }
        
        this.logger.log('角色初始化完成');
      } else {
        this.logger.log(`已存在 ${existingRoles.length} 个角色，跳过初始化`);
      }
    } catch (error) {
      this.logger.error(`角色初始化过程出错: ${error.message}`);
    }
  }
} 