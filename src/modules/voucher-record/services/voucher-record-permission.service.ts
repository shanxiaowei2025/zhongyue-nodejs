import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';

@Injectable()
export class VoucherRecordPermissionService {
  private readonly logger = new Logger(VoucherRecordPermissionService.name);

  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
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
        where: { code: roleCode },
      });

      if (!role) {
        this.logger.warn(`未找到代码为 ${roleCode} 的角色`);
        return roleCode; // 如果找不到对应角色，返回原代码
      }

      this.logger.log(`角色代码 ${roleCode} 对应的角色名称: ${role.name}`);
      return role.name;
    } catch (error) {
      this.logger.error(`获取角色名称失败: ${error.message}`, error.stack);
      return roleCode; // 出错时返回原代码
    }
  }

  /**
   * 检查用户是否有查看凭证记录的权限
   * @param roleCodes 用户角色代码数组
   * @returns 是否有权限
   */
  async hasViewPermission(roleCodes: string[]): Promise<boolean> {
    if (!roleCodes || roleCodes.length === 0) {
      return false;
    }

    for (const roleCode of roleCodes) {
      // 将角色代码转换为角色名称(中文)
      const roleName = await this.getRoleNameByCode(roleCode);
      
      const permission = await this.permissionRepository.findOne({
        where: {
          role_name: roleName,
          permission_name: 'voucher_record_action_view',
        },
      });

      if (permission && permission.permission_value) {
        this.logger.log(`角色 ${roleCode}(${roleName}) 具有查看凭证记录权限`);
        return true;
      }
    }

    this.logger.log(`角色 ${JSON.stringify(roleCodes)} 没有查看凭证记录权限`);
    return false;
  }

  /**
   * 检查用户是否有创建凭证记录的权限
   * @param roleCodes 用户角色代码数组
   * @returns 是否有权限
   */
  async hasCreatePermission(roleCodes: string[]): Promise<boolean> {
    if (!roleCodes || roleCodes.length === 0) {
      return false;
    }

    for (const roleCode of roleCodes) {
      // 将角色代码转换为角色名称(中文)
      const roleName = await this.getRoleNameByCode(roleCode);
      
      const permission = await this.permissionRepository.findOne({
        where: {
          role_name: roleName,
          permission_name: 'voucher_record_action_create',
        },
      });

      if (permission && permission.permission_value) {
        this.logger.log(`角色 ${roleCode}(${roleName}) 具有创建凭证记录权限`);
        return true;
      }
    }

    this.logger.log(`角色 ${JSON.stringify(roleCodes)} 没有创建凭证记录权限`);
    return false;
  }

  /**
   * 检查用户是否有编辑凭证记录的权限
   * @param roleCodes 用户角色代码数组
   * @returns 是否有权限
   */
  async hasEditPermission(roleCodes: string[]): Promise<boolean> {
    if (!roleCodes || roleCodes.length === 0) {
      return false;
    }

    for (const roleCode of roleCodes) {
      // 将角色代码转换为角色名称(中文)
      const roleName = await this.getRoleNameByCode(roleCode);
      
      const permission = await this.permissionRepository.findOne({
        where: {
          role_name: roleName,
          permission_name: 'voucher_record_action_edit',
        },
      });

      if (permission && permission.permission_value) {
        this.logger.log(`角色 ${roleCode}(${roleName}) 具有编辑凭证记录权限`);
        return true;
      }
    }

    this.logger.log(`角色 ${JSON.stringify(roleCodes)} 没有编辑凭证记录权限`);
    return false;
  }

  /**
   * 检查用户是否有删除凭证记录的权限
   * @param roleCodes 用户角色代码数组
   * @returns 是否有权限
   */
  async hasDeletePermission(roleCodes: string[]): Promise<boolean> {
    if (!roleCodes || roleCodes.length === 0) {
      return false;
    }

    for (const roleCode of roleCodes) {
      // 将角色代码转换为角色名称(中文)
      const roleName = await this.getRoleNameByCode(roleCode);
      
      const permission = await this.permissionRepository.findOne({
        where: {
          role_name: roleName,
          permission_name: 'voucher_record_action_delete',
        },
      });

      if (permission && permission.permission_value) {
        this.logger.log(`角色 ${roleCode}(${roleName}) 具有删除凭证记录权限`);
        return true;
      }
    }

    this.logger.log(`角色 ${JSON.stringify(roleCodes)} 没有删除凭证记录权限`);
    return false;
  }

  /**
   * 检查用户是否有导出凭证记录的权限
   * @param roleCodes 用户角色代码数组
   * @returns 是否有权限
   */
  async hasExportPermission(roleCodes: string[]): Promise<boolean> {
    if (!roleCodes || roleCodes.length === 0) {
      return false;
    }

    for (const roleCode of roleCodes) {
      // 将角色代码转换为角色名称(中文)
      const roleName = await this.getRoleNameByCode(roleCode);
      
      const permission = await this.permissionRepository.findOne({
        where: {
          role_name: roleName,
          permission_name: 'voucher_record_action_export',
        },
      });

      if (permission && permission.permission_value) {
        this.logger.log(`角色 ${roleCode}(${roleName}) 具有导出凭证记录权限`);
        return true;
      }
    }

    this.logger.log(`角色 ${JSON.stringify(roleCodes)} 没有导出凭证记录权限`);
    return false;
  }
} 