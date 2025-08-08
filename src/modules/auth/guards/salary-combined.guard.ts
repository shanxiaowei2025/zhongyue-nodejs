import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SalaryAccessGuard } from './salary-access.guard';

@Injectable()
export class SalaryCombinedGuard implements CanActivate {
  private readonly logger = new Logger(SalaryCombinedGuard.name);

  constructor(
    private jwtAuthGuard: JwtAuthGuard,
    private salaryAccessGuard: SalaryAccessGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('开始验证薪资访问权限（JWT + 薪资令牌）');

    try {
      // 1. 先验证JWT认证
      this.logger.debug('验证JWT认证');
      const isJwtValid = await this.jwtAuthGuard.canActivate(context);
      if (!isJwtValid) {
        this.logger.debug('JWT认证失败');
        return false;
      }
      this.logger.debug('JWT认证成功');

      // 2. 再验证薪资访问权限
      this.logger.debug('验证薪资访问权限');
      const hasSalaryAccess = await this.salaryAccessGuard.canActivate(context);
      if (!hasSalaryAccess) {
        this.logger.debug('薪资访问权限验证失败');
        return false;
      }
      this.logger.debug('薪资访问权限验证成功');

      return true;
    } catch (error) {
      this.logger.error('薪资访问权限验证过程中发生错误:', error.message);
      throw error; // 重新抛出异常，保持原有错误信息
    }
  }
}
