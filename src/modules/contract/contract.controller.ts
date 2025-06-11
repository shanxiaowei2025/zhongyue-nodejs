import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * 从合同对象或合同数组中移除敏感字段
 * @param data 合同对象或合同数组
 * @returns 处理后的数据
 */
function removeEncryptedCode(data: any): any {
  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => removeEncryptedCode(item));
  }
  
  // 处理对象
  if (data && typeof data === 'object') {
    // 如果是合同对象且有encryptedCode字段
    if ('encryptedCode' in data) {
      const { encryptedCode, ...rest } = data;
      return rest;
    }
    
    // 处理嵌套对象
    const result = { ...data };
    Object.keys(result).forEach(key => {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = removeEncryptedCode(result[key]);
      }
    });
    
    return result;
  }
  
  // 原始类型直接返回
  return data;
}

@ApiTags('合同管理')
@Controller('contract')
export class ContractController {
  private readonly logger = new Logger(ContractController.name);
  
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @ApiBearerAuth() // 需要登录才能访问
  @UseGuards(JwtAuthGuard, RolesGuard) // 使用JWT认证和角色守卫
  @ApiOperation({ summary: '创建合同' })
  @ApiResponse({ status: 201, description: '合同创建成功' })
  @ApiResponse({ status: 403, description: '没有创建合同的权限' })
  async create(@Body() createContractDto: CreateContractDto, @Request() req) {
    this.logger.debug(`用户请求创建合同，用户信息: ${JSON.stringify(req.user)}`);
    
    // 检查用户ID是否存在
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    const result = await this.contractService.create(createContractDto, req.user.id, req.user.username);
    return removeEncryptedCode(result);
  }

  @Get()
  @ApiBearerAuth() // 需要登录才能访问
  @UseGuards(JwtAuthGuard, RolesGuard) // 使用JWT认证和角色守卫
  @ApiOperation({ summary: '获取合同列表' })
  @ApiResponse({ status: 200, description: '获取合同列表成功' })
  async findAll(
    @Query() query: QueryContractDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    const { page = 1, pageSize = 10, ...filters } = query;
    const pagination = { page, pageSize };
    
    const result = await this.contractService.findAll(filters, pagination, req.user.id);
    
    // 移除列表中每个合同对象的encryptedCode字段
    if (result && result.list) {
      result.list = removeEncryptedCode(result.list);
    }
    
    return result;
  }

  @Get(':id')
  @ApiBearerAuth() // 需要登录才能访问
  @UseGuards(JwtAuthGuard, RolesGuard) // 使用JWT认证和角色守卫
  @ApiOperation({ summary: '获取合同详情' })
  @ApiResponse({ status: 200, description: '获取合同详情成功' })
  async findOne(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    const result = await this.contractService.findOne(+id, req.user.id);
    return removeEncryptedCode(result);
  }

  @Patch(':id')
  @ApiBearerAuth() // 需要登录才能访问
  @UseGuards(JwtAuthGuard, RolesGuard) // 使用JWT认证和角色守卫
  @ApiOperation({ summary: '更新合同信息' })
  @ApiResponse({ status: 200, description: '合同信息更新成功' })
  @ApiResponse({ status: 403, description: '没有更新合同的权限' })
  async update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    const result = await this.contractService.update(+id, updateContractDto, req.user.id);
    return removeEncryptedCode(result);
  }

  @Delete(':id')
  @ApiBearerAuth() // 需要登录才能访问
  @UseGuards(JwtAuthGuard, RolesGuard) // 使用JWT认证和角色守卫
  @ApiOperation({ summary: '删除合同' })
  @ApiResponse({ status: 200, description: '合同删除成功' })
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.contractService.remove(+id, req.user.id);
  }

  @Post(':id/sign')
  @ApiBearerAuth() // 需要登录才能访问
  @UseGuards(JwtAuthGuard, RolesGuard) // 使用JWT认证和角色守卫
  @ApiOperation({ summary: '签署合同' })
  @ApiResponse({ status: 200, description: '合同签署成功' })
  @ApiResponse({ status: 400, description: '合同已签署或已终止' })
  @ApiResponse({ status: 404, description: '合同不存在' })
  async signContract(
    @Param('id') id: string,
    @Body() signContractDto: SignContractDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    const result = await this.contractService.signContract(+id, signContractDto, req.user.id, req.user.username);
    return removeEncryptedCode(result);
  }
  
  @Get('get-image/:encryptedCode')
  @Public() // 标记为公开接口，无需身份验证
  @ApiOperation({ summary: '通过加密编号获取合同图片' })
  @ApiResponse({ status: 200, description: '获取合同图片成功' })
  @ApiResponse({ status: 404, description: '未找到该加密编号对应的合同' })
  @ApiParam({ name: 'encryptedCode', description: '合同加密编号', example: 'AB12CD34EF56GH78' })
  getContractImage(@Param('encryptedCode') encryptedCode: string) {
    this.logger.debug(`请求通过加密编号获取合同图片: ${encryptedCode}`);
    return this.contractService.getContractImageByEncryptedCode(encryptedCode);
  }
} 