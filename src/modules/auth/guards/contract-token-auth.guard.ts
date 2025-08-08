import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { TokenService } from '../../contract/services/token.service';

@Injectable()
export class ContractTokenAuthGuard implements CanActivate {
  private readonly logger = new Logger(ContractTokenAuthGuard.name);

  constructor(
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      this.logger.debug('请求中未找到合同令牌');
      return false; // 没有找到token，交给下一个守卫处理
    }

    // 验证合同令牌
    const tokenEntity = await this.tokenService.validateToken(token);
    if (!tokenEntity) {
      this.logger.debug(`合同令牌无效: ${token}`);
      return false; // 令牌无效，交给下一个守卫处理
    }

    // 验证通过，将令牌信息附加到请求中
    request.contractToken = {
      token: token,
      contractId: tokenEntity.contractId,
    };

    this.logger.debug(
      `合同令牌验证通过: ${token}, 合同ID: ${tokenEntity.contractId}`,
    );
    return true;
  }

  private extractTokenFromRequest(request: any): string | null {
    this.logger.debug(
      `尝试从请求中提取token, 请求路径: ${request.url}, 方法: ${request.method}`,
    );

    // 尝试从查询参数中获取token
    if (request.query && request.query.token) {
      this.logger.debug(`从查询参数中找到token: ${request.query.token}`);
      return request.query.token;
    }

    // 尝试从表单字段中获取token (适用于multipart/form-data)
    if (request.body && request.body.token) {
      this.logger.debug(`从请求体中找到token: ${request.body.token}`);
      return request.body.token;
    }

    // 尝试从multipart字段中获取token
    if (
      request.file &&
      request.file.fieldname === 'file' &&
      request.body &&
      request.body.token
    ) {
      this.logger.debug(`从文件上传表单中找到token: ${request.body.token}`);
      return request.body.token;
    }

    // 尝试从头部中获取token
    if (request.headers) {
      // 检查常规的合同令牌头
      if (request.headers['contract-token']) {
        this.logger.debug(
          `从请求头中找到token: ${request.headers['contract-token']}`,
        );
        return request.headers['contract-token'];
      }

      // 检查Authorization头并尝试提取Bearer token
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7);
        this.logger.debug(
          `从Authorization头中找到Bearer token: ${bearerToken}`,
        );
        return bearerToken;
      }
    }

    this.logger.debug('没有在请求中找到token');
    return null;
  }
}
