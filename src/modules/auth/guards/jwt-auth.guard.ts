// JWT认证守卫
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
// Injectable：标记这是一个可以注入的服务
// ExecutionContext：执行上下文，包含请求的详细信息
// UnauthorizedException：未授权异常，用于处理无权限访问

import { AuthGuard } from '@nestjs/passport';
// AuthGuard：Passport提供的认证守卫基类

@Injectable()  // 标记这是一个可注入的服务
export class JwtAuthGuard extends AuthGuard('jwt') {  // 继承自JWT认证守卫
  // 检查是否可以访问
  canActivate(context: ExecutionContext) {
    // 调用父类的canActivate方法进行JWT验证
    return super.canActivate(context);
  }

  // 处理验证结果
  handleRequest(err, user, info) {
    // 如果有错误或者没有用户信息
    if (err || !user) {
      // 抛出错误或者未授权异常
      throw err || new UnauthorizedException('未授权的访问');
    }
    // 验证通过，返回用户信息
    return user;
  }
}
