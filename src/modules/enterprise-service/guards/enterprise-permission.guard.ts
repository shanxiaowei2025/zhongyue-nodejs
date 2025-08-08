import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { EnterprisePermissionService } from '../services/enterprise-permission.service';

@Injectable()
export class EnterprisePermissionGuard implements CanActivate {
  private readonly logger = new Logger(EnterprisePermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private enterprisePermissionService: EnterprisePermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取路由上声明的需要的角色
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置角色要求，则默认允许访问
    if (!requiredRoles) {
      return true;
    }

    // 获取请求中的用户信息（由JWT守卫添加）
    const { user } = context.switchToHttp().getRequest();

    // 验证用户是否有权限访问
    if (!user) {
      throw new ForbiddenException('没有访问权限');
    }

    this.logger.log(`用户角色: ${JSON.stringify(user.roles)}`);

    // 首先检查用户是否拥有所需角色
    const hasRequiredRole = requiredRoles.some(
      (role) => user.roles && user.roles.includes(role),
    );

    // 如果有所需角色，直接允许访问
    if (hasRequiredRole) {
      this.logger.log('用户具有所需角色，允许访问');
      return true;
    }

    // 如果没有所需角色，检查是否有相应的权限
    if (user.roles && user.roles.length > 0) {
      // 用户可能有多个角色，检查每个角色是否有权限
      for (const roleCode of user.roles) {
        this.logger.log(`检查角色代码 ${roleCode} 的权限`);
        const hasPermission =
          await this.enterprisePermissionService.hasCustomerListPermission(
            roleCode,
          );

        if (hasPermission) {
          this.logger.log(`角色 ${roleCode} 具有所需权限，允许访问`);
          return true;
        }
      }
    }

    this.logger.warn('用户没有足够的权限访问此资源');
    throw new ForbiddenException('没有足够的权限访问此资源');
  }
}
