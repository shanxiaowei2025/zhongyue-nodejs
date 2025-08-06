import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SalaryAccessGuard implements CanActivate {
  private readonly logger = new Logger(SalaryAccessGuard.name);

  constructor(private jwtService: JwtService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. 检查是否有薪资访问令牌
    const salaryToken = this.extractSalaryToken(request);
    if (!salaryToken) {
      this.logger.debug('薪资访问令牌未找到');
      throw new UnauthorizedException('需要薪资访问权限，请先验证薪资密码');
    }
    
    try {
      // 2. 验证薪资令牌
      const salarySecret = process.env.SALARY_JWT_SECRET || process.env.JWT_SECRET + '_salary';
      const payload = this.jwtService.verify(salaryToken, {
        secret: salarySecret,
      });
      
      // 3. 检查令牌类型
      if (payload.type !== 'salary_access') {
        this.logger.debug('无效的薪资访问令牌类型');
        throw new UnauthorizedException('无效的薪资访问令牌');
      }
      
      // 4. 检查令牌用户与当前用户是否匹配
      if (payload.userId !== request.user.id) {
        this.logger.debug('薪资访问令牌与当前用户不匹配');
        throw new UnauthorizedException('薪资访问令牌与当前用户不匹配');
      }
      
      // 5. 将薪资访问权限信息添加到请求中
      request.salaryAccess = {
        userId: payload.userId,
        username: payload.username,
        grantedAt: payload.iat,
        tokenType: payload.type,
      };
      
      this.logger.debug(`薪资访问权限验证成功: 用户ID ${payload.userId}`);
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.logger.debug('薪资访问权限已过期');
        throw new UnauthorizedException('薪资访问权限已过期，请重新验证薪资密码');
      }
      if (error.name === 'JsonWebTokenError') {
        this.logger.debug('薪资访问令牌格式错误');
        throw new UnauthorizedException('薪资访问令牌格式错误');
      }
      
      this.logger.error('薪资访问令牌验证失败:', error.message);
      throw new UnauthorizedException('薪资访问令牌验证失败');
    }
  }
  
  /**
   * 从请求中提取薪资令牌
   * @param request 请求对象
   * @returns 薪资令牌字符串或undefined
   */
  private extractSalaryToken(request: any): string | undefined {
    // 优先从专用头部获取
    let token = request.headers['x-salary-token'] || request.headers['salary-access-token'];
    
    // 如果没有找到，尝试从Authorization头部获取（格式：Bearer <token>）
    if (!token) {
      const authHeader = request.headers['x-salary-authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    return token;
  }
} 