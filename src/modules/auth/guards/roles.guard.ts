import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    // 检查用户是否拥有所需角色
    const hasRole = requiredRoles.some(
      (role) => user.roles && user.roles.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException('没有足够的权限访问此资源');
    }

    return true;
  }
}
