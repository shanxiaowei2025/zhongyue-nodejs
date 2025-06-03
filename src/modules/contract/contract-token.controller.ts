import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Logger,
  NotFoundException,
  Query,
  BadRequestException,
  InternalServerErrorException,
  Body,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TokenService } from './services/token.service';
import { ContractService } from './contract.service';
import { SaveSignatureDto } from './dto/save-signature.dto';
import { StorageService } from '../storage/storage.service';

@ApiTags('合同令牌')
@Controller('contract-token')
export class ContractTokenController {
  private readonly logger = new Logger(ContractTokenController.name);
  
  constructor(
    private readonly tokenService: TokenService,
    private readonly contractService: ContractService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: '根据合同ID生成临时令牌(30分钟有效)' })
  @ApiResponse({ status: 200, description: '临时令牌生成成功' })
  @ApiResponse({ status: 400, description: '参数错误或合同已签署/已终止' })
  @ApiResponse({ status: 404, description: '合同不存在' })
  @ApiQuery({ name: 'id', required: true, description: '合同ID' })
  async generateTemporaryToken(@Query('id') id: string) {
    if (!id || isNaN(+id)) {
      throw new BadRequestException('合同ID参数错误');
    }
    
    // 验证合同存在
    try {
      const contractId = +id;
      
      // 检查合同是否存在
      try {
        // 这里我们尝试使用管理员用户ID查询（为简单起见，使用ID 1）
        // 实际生产环境应考虑更安全的验证方式
        const contract = await this.contractService.findOne(contractId, 1);
        
        // TokenService内部会处理合同状态：
        // 1. 如果合同已签署(contractStatus='1')，会抛出BadRequestException并删除所有相关token
        // 2. 如果合同已终止(contractStatus='2')，会抛出BadRequestException并删除所有相关token
        // 3. 如果合同未签署未终止，会正常生成token
        const token = await this.tokenService.generateTemporaryToken(contractId, 30);
        
        return {
          token: token.token,
          contractId: token.contractId,
          expiredAt: token.expiredAt,
        };
      } catch (error) {
        // 如果是权限问题，我们尝试直接查询数据库
        if (error instanceof ForbiddenException) {
          this.logger.warn(`使用默认管理员ID查询合同失败，合同ID: ${contractId}`);
          throw new InternalServerErrorException('权限验证失败，请联系管理员');
        }
        
        // 如果是BadRequestException（包括合同已签署或已终止），直接向上抛出
        if (error instanceof BadRequestException) {
          throw error;
        }
        
        throw error;
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`生成临时令牌出错: ${error.message}`, error.stack);
      throw new BadRequestException('生成临时令牌失败');
    }
  }

  @Get('validate/:token')
  @ApiOperation({ summary: '验证令牌' })
  @ApiResponse({ status: 200, description: '令牌验证成功，返回关联的合同信息' })
  @ApiResponse({ status: 404, description: '令牌不存在' })
  @ApiParam({ name: 'token', description: '令牌值' })
  async validateToken(@Param('token') token: string) {
    const tokenEntity = await this.tokenService.validateToken(token);
    if (!tokenEntity) {
      throw new NotFoundException('令牌不存在');
    }
    
    return {
      valid: true,
      contract: tokenEntity.contract,
    };
  }

  @Get('image')
  @ApiOperation({ summary: '获取合同图片' })
  @ApiResponse({ status: 200, description: '成功获取合同图片URL' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '该连接已失效' })
  @ApiQuery({ name: 'token', required: true, description: '合同令牌' })
  async getContractImage(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('令牌参数不能为空');
    }
    
    try {
      // 验证令牌有效性并直接获取合同图片
      const contractImage = await this.tokenService.getContractImageByToken(token);
      
      if (!contractImage) {
        // 检查token是否存在
        const tokenExists = await this.tokenService.validateToken(token);
        if (!tokenExists) {
          throw new NotFoundException('该连接已失效');
        }
        
        throw new NotFoundException('合同没有图片');
      }
      
      // 尝试获取token实体以获取合同ID
      const tokenEntity = await this.tokenService.validateToken(token);
      const contractId = tokenEntity ? tokenEntity.contractId : null;
      
      return {
        contractImage,
        contractId
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`获取合同图片出错: ${error.message}`, error.stack);
      throw new BadRequestException('获取合同图片失败');
    }
  }

  @Post('signature')
  @ApiOperation({ summary: '保存合同签名图片' })
  @ApiResponse({ status: 201, description: '签名保存成功' })
  @ApiResponse({ status: 400, description: '参数错误或令牌与合同不匹配' })
  @ApiResponse({ status: 404, description: '该连接已失效或合同不存在' })
  @ApiBody({ type: SaveSignatureDto })
  async saveSignature(@Body() saveSignatureDto: SaveSignatureDto) {
    const { contractId, token, signatureUrl } = saveSignatureDto;
    
    // 先验证token是否存在
    const tokenExists = await this.tokenService.validateToken(token);
    if (!tokenExists) {
      throw new NotFoundException('该连接已失效');
    }
    
    // 验证token是否与合同ID相关联
    const isValid = await this.tokenService.validateTokenForContract(token, contractId);
    if (!isValid) {
      throw new BadRequestException('令牌与合同不匹配');
    }
    
    // 保存签名
    const success = await this.contractService.saveContractSignature(contractId, signatureUrl);
    if (!success) {
      throw new BadRequestException('保存签名失败，请确认合同存在且未终止');
    }
    
    return {
      success: true,
      message: '签名保存成功',
      contractId
    };
  }
} 