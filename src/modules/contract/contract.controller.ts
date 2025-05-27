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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('合同管理')
@ApiBearerAuth() // 需要登录才能访问
@UseGuards(JwtAuthGuard, RolesGuard) // 使用JWT认证和角色守卫
@Controller('contract')
export class ContractController {
  private readonly logger = new Logger(ContractController.name);
  
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @ApiOperation({ summary: '创建合同' })
  @ApiResponse({ status: 201, description: '合同创建成功' })
  @ApiResponse({ status: 403, description: '没有创建合同的权限' })
  create(@Body() createContractDto: CreateContractDto, @Request() req) {
    this.logger.debug(`用户请求创建合同，用户信息: ${JSON.stringify(req.user)}`);
    
    // 检查用户ID是否存在
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.contractService.create(createContractDto, req.user.id, req.user.username);
  }

  @Get()
  @ApiOperation({ summary: '获取合同列表' })
  @ApiResponse({ status: 200, description: '获取合同列表成功' })
  findAll(
    @Query() query: QueryContractDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    const { page = 1, pageSize = 10, ...filters } = query;
    const pagination = { page, pageSize };
    
    return this.contractService.findAll(filters, pagination, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取合同详情' })
  @ApiResponse({ status: 200, description: '获取合同详情成功' })
  findOne(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.contractService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新合同信息' })
  @ApiResponse({ status: 200, description: '合同信息更新成功' })
  @ApiResponse({ status: 403, description: '没有更新合同的权限' })
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.contractService.update(+id, updateContractDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除合同' })
  @ApiResponse({ status: 200, description: '合同删除成功' })
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.contractService.remove(+id, req.user.id);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: '签署合同' })
  @ApiResponse({ status: 200, description: '合同签署成功' })
  @ApiResponse({ status: 400, description: '合同已签署或已终止' })
  @ApiResponse({ status: 404, description: '合同不存在' })
  signContract(
    @Param('id') id: string,
    @Body() signContractDto: SignContractDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.contractService.signContract(+id, signContractDto, req.user.id, req.user.username);
  }
} 