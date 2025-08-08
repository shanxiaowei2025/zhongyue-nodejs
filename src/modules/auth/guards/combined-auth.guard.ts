import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ContractTokenAuthGuard } from './contract-token-auth.guard';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private readonly logger = new Logger(CombinedAuthGuard.name);

  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly contractTokenAuthGuard: ContractTokenAuthGuard,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否是公共路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果是公共路由，直接允许访问
    if (isPublic) {
      return true;
    }

    try {
      // 先尝试合同令牌认证
      const isContractTokenValid =
        await this.contractTokenAuthGuard.canActivate(context);
      if (isContractTokenValid) {
        this.logger.debug('合同令牌认证成功');
        return true;
      }

      // 如果合同令牌认证失败，尝试JWT认证
      const isJwtValid = await this.jwtAuthGuard.canActivate(context);
      if (isJwtValid) {
        this.logger.debug('JWT认证成功');
        return true;
      }

      // 两种认证都失败
      this.logger.debug('认证失败: 合同令牌和JWT认证都失败');
      throw new UnauthorizedException('未授权的访问，请提供有效的令牌');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`认证过程中发生错误: ${error.message}`, error.stack);
      throw new UnauthorizedException('认证过程中发生错误');
    }
  }
}
