import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '../../permissions/services/permission.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Injectable()
export class EnterprisePermissionService {
  private readonly logger = new Logger(EnterprisePermissionService.name);

  constructor(
    private permissionService: PermissionService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}
  
  /**
   * 将角色代码(英文)转换为角色名称(中文)
   * @param roleCode 角色代码
   * @returns 角色名称(中文)
   */
  async getRoleNameByCode(roleCode: string): Promise<string> {
    try {
      const role = await this.roleRepository.findOne({
        where: { code: roleCode }
      });
      
      if (!role) {
        this.logger.warn(`未找到代码为 ${roleCode} 的角色`);
        return roleCode; // 如果找不到对应角色，返回原代码
      }
      
      return role.name;
    } catch (error) {
      this.logger.error(`获取角色名称失败: ${error.message}`, error.stack);
      return roleCode; // 出错时返回原代码
    }
  }
  
  /**
   * 检查用户是否有权限访问企业服务客户接口
   * @param roleCode 用户角色代码(英文)
   * @returns 是否有权限
   */
  async hasCustomerListPermission(roleCode: string): Promise<boolean> {
    try {
      // 先将角色代码转换为角色名称(中文)
      const roleName = await this.getRoleNameByCode(roleCode);
      this.logger.log(`角色代码 ${roleCode} 对应的角色名称: ${roleName}`);
      
      // 使用角色名称(中文)查询权限表
      const { permission_value } = await this.permissionService.getPermissionValueByName(
        roleName,
        'contract_action_create'
      );
      
      return permission_value;
    } catch (error) {
      this.logger.error(`检查权限失败: ${error.message}`, error.stack);
      return false;
    }
  }
} 