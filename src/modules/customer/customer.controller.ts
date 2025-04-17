// 控制器负责处理来自客户端的请求
// 主要功能：
// 1. 定义 API 路由（如 GET /customer, POST /customer 等）
// 2. 处理请求参数
// 3. 调用相应的服务方法
// 4. 返回响应给客户端
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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('客户管理')
@ApiBearerAuth() // 需要登录才能访问
@UseGuards(JwtAuthGuard) // 使用JWT认证
@Controller('customer')
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);
  
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: '创建客户信息' })
  @ApiResponse({ status: 201, description: '客户信息创建成功' })
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    this.logger.debug(`用户请求创建客户，用户信息: ${JSON.stringify(req.user)}`);
    
    // 检查用户ID是否存在
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.create(createCustomerDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取客户列表' })
  @ApiResponse({ status: 200, description: '获取客户列表成功' })
  findAll(@Query() query: QueryCustomerDto, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取客户详情' })
  @ApiResponse({ status: 200, description: '获取客户详情成功' })
  findOne(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新客户信息' })
  @ApiResponse({ status: 200, description: '客户信息更新成功' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req
  ) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.update(+id, updateCustomerDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户信息' })
  @ApiResponse({ status: 200, description: '客户信息删除成功' })
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user || !req.user.id) {
      throw new ForbiddenException('未能获取有效的用户身份');
    }
    
    return this.customerService.remove(+id, req.user.id);
  }
}
