import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VoucherRecordPermissionService } from '../services/voucher-record-permission.service';

import { SetMetadata } from '@nestjs/common';

export const VOUCHER_RECORD_PERMISSION_KEY = 'voucher_record_permission';
export const VoucherRecordPermission = (permission: string) => 
  SetMetadata(VOUCHER_RECORD_PERMISSION_KEY, permission);

@Injectable()
export class VoucherRecordPermissionGuard implements CanActivate {
  private readonly logger = new Logger(VoucherRecordPermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly voucherRecordPermissionService: VoucherRecordPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取路由上声明的需要的权限
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      VOUCHER_RECORD_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置权限要求，则默认允许访问
    if (!requiredPermission) {
      return true;
    }

    // 获取请求中的用户信息（由JWT守卫添加）
    const { user } = context.switchToHttp().getRequest();

    // 验证用户是否有权限访问
    if (!user) {
      throw new ForbiddenException('没有访问权限');
    }

    this.logger.log(`检查用户角色 ${JSON.stringify(user.roles)} 的凭证记录权限: ${requiredPermission}`);

    // 根据权限类型检查相应权限
    let hasPermission = false;
    switch (requiredPermission) {
      case 'view':
        hasPermission = await this.voucherRecordPermissionService.hasViewPermission(user.roles);
        break;
      case 'create':
        hasPermission = await this.voucherRecordPermissionService.hasCreatePermission(user.roles);
        break;
      case 'edit':
        hasPermission = await this.voucherRecordPermissionService.hasEditPermission(user.roles);
        break;
      case 'delete':
        hasPermission = await this.voucherRecordPermissionService.hasDeletePermission(user.roles);
        break;
      case 'export':
        hasPermission = await this.voucherRecordPermissionService.hasExportPermission(user.roles);
        break;
      default:
        this.logger.warn(`未知的凭证记录权限类型: ${requiredPermission}`);
        hasPermission = false;
    }

    if (!hasPermission) {
      this.logger.warn(`用户没有足够的凭证记录权限: ${requiredPermission}`);
      throw new ForbiddenException('没有足够的权限访问此资源');
    }

    this.logger.log(`用户具有凭证记录权限: ${requiredPermission}，允许访问`);
    return true;
  }
} 