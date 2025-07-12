import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Token } from '../entities/token.entity';
import { randomBytes } from 'crypto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  /**
   * 为合同生成临时令牌，指定过期时间
   * @param contractId 合同ID
   * @param expiresInMinutes 过期时间(分钟)
   */
  async generateTemporaryToken(
    contractId: number,
    expiresInMinutes: number = 30,
  ): Promise<Token> {
    // 检查合同状态
    const contractStatus = await this.getContractStatus(contractId);

    // 合同状态为1(已签署)或2(已终止)时，不允许生成令牌
    if (contractStatus === '1' || contractStatus === '2') {
      // 删除该合同的所有token
      await this.deleteContractTokens(contractId);

      const statusMessage = contractStatus === '1' ? '已签署' : '已终止';
      this.logger.warn(
        `合同 #${contractId} ${statusMessage}，删除所有相关令牌并拒绝生成新令牌`,
      );
      throw new BadRequestException(`合同${statusMessage}，无法生成令牌`);
    }

    // 生成随机令牌
    const token = randomBytes(32).toString('hex');

    // 计算过期时间
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + expiresInMinutes);

    // 创建并保存令牌
    const tokenEntity = this.tokenRepository.create({
      token,
      contractId,
      expiredAt,
    });

    this.logger.debug(
      `为合同 #${contractId} 生成临时令牌，过期时间: ${expiredAt.toISOString()}`,
    );
    return await this.tokenRepository.save(tokenEntity);
  }

  /**
   * 获取合同状态
   * @param contractId 合同ID
   * @returns 合同状态：'0'未签署, '1'已签署, '2'已终止, null不存在
   */
  async getContractStatus(contractId: number): Promise<string | null> {
    try {
      // 直接查询数据库检查合同状态
      const query = `
        SELECT contractStatus 
        FROM sys_contract 
        WHERE id = ?
      `;

      const result = await this.tokenRepository.query(query, [contractId]);

      if (result && result.length > 0) {
        return result[0].contractStatus;
      }

      return null; // 合同不存在
    } catch (error) {
      this.logger.error(`获取合同状态失败: ${error.message}`, error.stack);
      return null; // 出错时返回null
    }
  }

  /**
   * 检查合同是否已签署或已终止
   * @param contractId 合同ID
   */
  async isContractSignedOrTerminated(contractId: number): Promise<boolean> {
    const status = await this.getContractStatus(contractId);
    // 状态为'1'(已签署)或'2'(已终止)时返回true
    return status === '1' || status === '2';
  }

  /**
   * 验证令牌有效性
   * @param token 令牌值
   */
  async validateToken(token: string): Promise<Token | null> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { token },
      relations: ['contract'],
    });

    if (!tokenEntity) {
      this.logger.debug(`令牌不存在: ${token}`);
      return null;
    }

    // 如果有过期时间，检查是否已过期
    if (tokenEntity.expiredAt && new Date() > tokenEntity.expiredAt) {
      this.logger.debug(
        `令牌已过期: ${token}, 过期时间: ${tokenEntity.expiredAt.toISOString()}`,
      );
      // 删除过期令牌
      await this.deleteToken(token);
      return null;
    }

    // 检查合同是否已签署或已终止
    if (
      tokenEntity.contract &&
      (tokenEntity.contract.contractStatus === '1' ||
        tokenEntity.contract.contractStatus === '2')
    ) {
      const statusMessage =
        tokenEntity.contract.contractStatus === '1' ? '已签署' : '已终止';
      this.logger.debug(
        `合同 #${tokenEntity.contractId} ${statusMessage}，令牌 ${token} 无效`,
      );
      // 删除该合同的所有令牌
      await this.deleteContractTokens(tokenEntity.contractId);
      return null;
    }

    return tokenEntity;
  }

  /**
   * 删除令牌
   * @param token 令牌值
   */
  async deleteToken(token: string): Promise<void> {
    await this.tokenRepository.delete({ token });
    this.logger.debug(`删除令牌: ${token}`);
  }

  /**
   * 删除合同的所有令牌
   * @param contractId 合同ID
   */
  async deleteContractTokens(contractId: number): Promise<void> {
    const result = await this.tokenRepository.delete({ contractId });
    this.logger.debug(
      `删除合同 #${contractId} 的所有令牌, 删除数量: ${result.affected || 0}`,
    );
  }

  /**
   * 定时清理过期的令牌（每5分钟执行一次）
   */
  @Cron('0 */5 * * * *')
  async cleanupExpiredTokens() {
    const now = new Date();
    const result = await this.tokenRepository.delete({
      expiredAt: LessThan(now),
    });

    if (result.affected > 0) {
      this.logger.log(`已清理 ${result.affected} 个过期令牌`);
    }
  }

  /**
   * 获取令牌关联的合同图片和合同类型
   * @param token 令牌值
   * @returns 包含合同图片URL和合同类型的对象，如果合同不存在则返回null
   */
  async getContractImageByToken(
    token: string,
  ): Promise<{ contractImage: string; contractType: string } | null> {
    try {
      // 直接查询数据库获取token关联的合同图片和合同类型
      const query = `
        SELECT c.contractImage, c.contractType 
        FROM sys_token t
        JOIN sys_contract c ON t.contractId = c.id
        WHERE t.token = ?
      `;

      const result = await this.tokenRepository.query(query, [token]);

      if (result && result.length > 0) {
        return {
          contractImage: result[0].contractImage || null,
          contractType: result[0].contractType || null,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `获取令牌关联的合同信息失败: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * 验证令牌是否与特定合同ID相关联
   * @param token 令牌值
   * @param contractId 合同ID
   */
  async validateTokenForContract(
    token: string,
    contractId: number,
  ): Promise<boolean> {
    try {
      const tokenEntity = await this.tokenRepository.findOne({
        where: {
          token,
          contractId,
        },
      });

      if (!tokenEntity) {
        this.logger.debug(`令牌 ${token} 与合同ID ${contractId} 不匹配`);
        return false;
      }

      // 如果有过期时间，检查是否已过期
      if (tokenEntity.expiredAt && new Date() > tokenEntity.expiredAt) {
        this.logger.debug(
          `令牌已过期: ${token}, 过期时间: ${tokenEntity.expiredAt.toISOString()}`,
        );
        return false;
      }

      // 检查合同状态
      const contractStatus = await this.getContractStatus(contractId);
      if (contractStatus === '1' || contractStatus === '2') {
        const statusMessage = contractStatus === '1' ? '已签署' : '已终止';
        this.logger.debug(
          `合同 #${contractId} ${statusMessage}，令牌 ${token} 无效`,
        );
        // 删除该合同的所有令牌
        await this.deleteContractTokens(contractId);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`验证令牌失败: ${error.message}`, error.stack);
      return false;
    }
  }
}
