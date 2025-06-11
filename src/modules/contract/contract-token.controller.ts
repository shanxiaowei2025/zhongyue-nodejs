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
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import * as sharp from 'sharp';

@ApiTags('合同令牌')
@Controller('contract-token')
export class ContractTokenController {
  private readonly logger = new Logger(ContractTokenController.name);
  
  constructor(
    private readonly tokenService: TokenService,
    private readonly contractService: ContractService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
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
      // 验证令牌有效性并获取合同图片和合同类型
      const contractInfo = await this.tokenService.getContractImageByToken(token);
      
      if (!contractInfo) {
        // 检查token是否存在
        const tokenExists = await this.tokenService.validateToken(token);
        if (!tokenExists) {
          throw new NotFoundException('该连接已失效');
        }
        
        throw new NotFoundException('合同没有图片');
      }
      
      // 如果合同图片不存在
      if (!contractInfo.contractImage) {
        throw new NotFoundException('合同没有图片');
      }
      
      // 尝试获取token实体以获取合同ID
      const tokenEntity = await this.tokenService.validateToken(token);
      const contractId = tokenEntity ? tokenEntity.contractId : null;
      
      return {
        contractImage: contractInfo.contractImage,
        contractType: contractInfo.contractType,
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

  // 根据合同类型获取签名坐标位置（基于左下角为原点）
  private getSignaturePosition(contractType: string): { x: number, y: number, width: number } {
    console.log(`获取签名位置，合同类型: "${contractType}"`);
    
    let position;
    switch (contractType) {
      case '产品服务协议':
        position = { x: 440, y: 1085, width: 430 };
        break;
      case '代理记账合同':
        position = { x: 464, y: 1257, width: 500 };
        break;
      case '单项服务合同':
        position = { x: 430, y: 1688, width: 430 };
        break;
      default:
        position = { x: 450, y: 1200, width: 430 };
        break;
    }
    
    console.log(`根据合同类型 "${contractType}" 获取到签名位置:`, position);
    return position;
  }

  // 下载图片到临时文件
  private async downloadImage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const tempDir = path.join(os.tmpdir(), 'contract-images');
      
      // 确保临时目录存在
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `image-${Date.now()}.png`);
      fs.writeFileSync(tempFilePath, Buffer.from(response.data));
      
      return tempFilePath;
    } catch (error) {
      this.logger.error(`下载图片失败: ${error.message}`, error.stack);
      throw new BadRequestException('下载图片失败');
    }
  }

  // 生成完整的合同图片URL
  private getContractImageUrl(contractImage: string): string {
    const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT') || 
                          this.configService.get<string>('minio.endPoint');
    const minioBucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 
                            this.configService.get<string>('minio.bucketName');
    
    return `https://${minioEndpoint}/${minioBucketName}/${contractImage}`;
  }

  // 合并签名图片和合同图片
  private async mergeImages(contractImagePath: string, signatureImagePath: string, contractType: string): Promise<Buffer> {
    try {
      // 添加调试日志，确认方法被调用
      console.log(`===== 开始合并图片，合同类型: ${contractType} =====`);
      this.logger.log(`开始合并图片，合同类型: ${contractType}`);
      
      // 获取签名位置（现在这个位置是基于左下角为原点的）
      const position = this.getSignaturePosition(contractType);
      console.log(`===== 获取到的签名位置: x=${position.x}, y=${position.y}, width=${position.width} =====`);
      this.logger.log(`获取到的签名位置: x=${position.x}, y=${position.y}, width=${position.width}`);
      
      // 读取合同图片和获取元数据（包括高度）
      this.logger.log(`正在读取合同图片: ${contractImagePath}`);
      const contractImage = sharp(contractImagePath);
      const contractImageMetadata = await contractImage.metadata();
      const imageHeight = contractImageMetadata.height;
      console.log(`===== 合同图片高度: ${imageHeight} =====`);
      this.logger.log(`合同图片高度: ${imageHeight}`);
      
      // 读取签名图片并获取原始元数据
      this.logger.log(`正在读取签名图片: ${signatureImagePath}`);
      const signatureMetadata = await sharp(signatureImagePath).metadata();
      const originalWidth = signatureMetadata.width;
      const originalHeight = signatureMetadata.height;
      
      // 计算等比缩放后的高度
      const aspectRatio = originalHeight / originalWidth;
      const resizedHeight = Math.round(position.width * aspectRatio);
      
      console.log(`===== 签名图片原始尺寸: ${originalWidth}x${originalHeight}, 缩放后尺寸: ${position.width}x${resizedHeight} =====`);
      this.logger.log(`签名图片原始尺寸: ${originalWidth}x${originalHeight}, 缩放后尺寸: ${position.width}x${resizedHeight}`);
      
      // 读取并按照宽度等比缩放签名图片
      this.logger.log(`正在缩放签名图片...`);
      const resizedSignature = await sharp(signatureImagePath)
        .resize({
          width: position.width,
          // 根据原始比例计算高度
          height: resizedHeight,
          // 不保持纵横比，因为我们已经计算好了
          fit: 'fill',
          // 允许放大
          withoutEnlargement: false
        })
        .toBuffer();
      
      // 坐标转换：从左下角为原点转换为左上角为原点
      const topPosition = imageHeight - position.y - resizedHeight;
      
      console.log(`===== 签名位置: x=${position.x}, y=${position.y}, 转换后top=${topPosition} =====`);
      this.logger.log(`签名位置: x=${position.x}, y=${position.y}, 转换后top=${topPosition}`);
      
      // 合成图片（使用转换后的坐标）
      this.logger.log(`开始合成图片...`);
      return await sharp(contractImagePath)
        .composite([
          {
            input: resizedSignature,
            top: topPosition, // 使用转换后的y坐标
            left: position.x, // x坐标不变
          }
        ])
        .toBuffer();
    } catch (error) {
      console.error(`合并图片失败: ${error.message}`, error.stack);
      this.logger.error(`合并图片失败: ${error.message}`, error.stack);
      throw new BadRequestException('合并图片失败');
    }
  }

  @Post('signature')
  @ApiOperation({ summary: '保存合同签名图片并合成' })
  @ApiResponse({ status: 201, description: '签名保存成功' })
  @ApiResponse({ status: 400, description: '参数错误或令牌与合同不匹配' })
  @ApiResponse({ status: 404, description: '该连接已失效或合同不存在' })
  @ApiBody({ type: SaveSignatureDto })
  async saveSignature(@Body() saveSignatureDto: SaveSignatureDto) {
    const { contractId, token, signatureUrl } = saveSignatureDto;
    
    console.log(`接收到签名请求，合同ID: ${contractId}, 签名URL: ${signatureUrl}`);
    this.logger.log(`接收到签名请求，合同ID: ${contractId}, 签名URL: ${signatureUrl}`);
    
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
    
    try {
      // 获取合同图片信息
      this.logger.log(`获取合同图片信息，令牌: ${token}`);
      const contractInfo = await this.tokenService.getContractImageByToken(token);
      console.log(`获取到的合同信息:`, contractInfo);
      
      if (!contractInfo || !contractInfo.contractImage) {
        throw new BadRequestException('合同没有图片');
      }
      
      // 1. 下载签名图片到临时文件
      this.logger.log(`下载签名图片: ${signatureUrl}`);
      const signatureImagePath = await this.downloadImage(signatureUrl);
      console.log(`签名图片已下载到: ${signatureImagePath}`);
      
      // 2. 构建合同图片URL并下载
      const contractImageUrl = this.getContractImageUrl(contractInfo.contractImage);
      this.logger.log(`下载合同图片: ${contractImageUrl}`);
      const contractImagePath = await this.downloadImage(contractImageUrl);
      console.log(`合同图片已下载到: ${contractImagePath}`);
      
      // 3. 合并图片
      this.logger.log(`开始合并图片，合同类型: ${contractInfo.contractType}`);
      console.log(`合同类型: "${contractInfo.contractType}"`);
      const mergedImageBuffer = await this.mergeImages(
        contractImagePath, 
        signatureImagePath, 
        contractInfo.contractType
      );
      console.log(`图片合并完成，合并后大小: ${mergedImageBuffer.length} 字节`);
      
      // 4. 上传合成后的图片到MinIO
      const timestamp = Date.now();
      const mergedImageName = `contract-${contractId}-signed-${timestamp}.png`;
      const mergedImagePath = path.join(os.tmpdir(), 'contract-images', mergedImageName);
      fs.writeFileSync(mergedImagePath, mergedImageBuffer);
      
      // 创建文件对象，模拟multer上传文件的格式
      const file = {
        buffer: mergedImageBuffer,
        originalname: mergedImageName,
        mimetype: 'image/png',
        size: mergedImageBuffer.length
      };
      
      // 上传到MinIO
      this.logger.log(`上传合成图片到MinIO: ${mergedImageName}`);
      const uploadedFileName = await this.storageService.uploadFile(file as any);
      const uploadedFileUrl = await this.storageService.getFileUrl(uploadedFileName);
      console.log(`合成图片已上传，URL: ${uploadedFileUrl}`);
      
      // 保存原始签名URL到数据库，而不是合成后的图片URL
      this.logger.log(`保存签名URL到数据库: ${signatureUrl}`);
      const success = await this.contractService.saveContractSignature(contractId, signatureUrl);
      if (!success) {
        throw new BadRequestException('保存签名失败，请确认合同存在且未终止');
      }
      
      // 签名保存成功后，获取合同的加密编号
      const encryptedCode = await this.contractService.getContractEncryptedCode(contractId);
      
      // 清理临时文件
      try {
        fs.unlinkSync(signatureImagePath);
        fs.unlinkSync(contractImagePath);
        fs.unlinkSync(mergedImagePath);
      } catch (error) {
        this.logger.warn(`清理临时文件失败: ${error.message}`);
      }
      
      return {
        success: true,
        message: '签名保存成功',
        contractId,
        compositeSignatureUrl: uploadedFileUrl, // 返回合成图片的URL，但不保存在数据库中
        encryptedCode: encryptedCode // 返回合同的加密编号
      };
    } catch (error) {
      console.error(`处理签名图片失败: ${error.message}`, error.stack);
      this.logger.error(`处理签名图片失败: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('处理签名图片失败');
    }
  }
} 