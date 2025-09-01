import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CustomerStatusHistoryService } from './customer-status-history.service';
import { CreateStatusHistoryDto } from './dto/create-status-history.dto';
import { QueryStatusHistoryDto } from './dto/query-status-history.dto';
import {
  StatusHistoryResponseDto,
  CustomerStatusAtTimeDto,
} from './dto/status-history-response.dto';

@ApiTags('客户状态历史管理')
@Controller('reports/customer-status-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true }))
export class CustomerStatusHistoryController {
  private readonly logger = new Logger(CustomerStatusHistoryController.name);

  constructor(
    private readonly statusHistoryService: CustomerStatusHistoryService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: '创建客户状态历史记录', 
    description: '手动创建客户状态变更历史记录，需要管理员权限' 
  })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: 'object'
  })
  @Roles('admin', 'super_admin')
  async createStatusHistory(
    @Body() createDto: CreateStatusHistoryDto,
    @Request() req: any
  ) {
    try {
      this.logger.log(`用户 ${req.user.id} 创建客户状态历史记录`);
      return await this.statusHistoryService.createStatusHistory(createDto);
    } catch (error) {
      this.logger.error(`创建客户状态历史记录失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '创建客户状态历史记录失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ 
    summary: '查询客户状态历史记录', 
    description: '根据条件查询客户状态变更历史记录' 
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: StatusHistoryResponseDto
  })
  async findStatusHistory(
    @Query() query: QueryStatusHistoryDto,
    @Request() req: any
  ): Promise<StatusHistoryResponseDto> {
    try {
      this.logger.log(`用户 ${req.user.id} 查询客户状态历史记录`);
      return await this.statusHistoryService.findStatusHistory(query);
    } catch (error) {
      this.logger.error(`查询客户状态历史记录失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '查询失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('customer/:customerId')
  @ApiOperation({ 
    summary: '查询指定客户的状态历史', 
    description: '获取指定客户的所有状态变更历史记录' 
  })
  @ApiParam({ name: 'customerId', description: '客户ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: 'array'
  })
  async findByCustomerId(
    @Param('customerId') customerId: number,
    @Request() req: any
  ) {
    try {
      this.logger.log(`用户 ${req.user.id} 查询客户 ${customerId} 的状态历史`);
      return await this.statusHistoryService.findByCustomerId(+customerId);
    } catch (error) {
      this.logger.error(`查询客户状态历史失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '查询失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status-at-time')
  @ApiOperation({ 
    summary: '查询客户在指定时间点的状态', 
    description: '获取客户在特定日期的状态信息' 
  })
  @ApiQuery({ name: 'customerId', description: '客户ID', type: 'number' })
  @ApiQuery({ name: 'targetDate', description: '目标日期', example: '2025-01-15' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: CustomerStatusAtTimeDto
  })
  async getCustomerStatusAtTime(
    @Query('customerId') customerId: number,
    @Query('targetDate') targetDate: string,
    @Request() req: any
  ): Promise<CustomerStatusAtTimeDto | null> {
    try {
      this.logger.log(`用户 ${req.user.id} 查询客户 ${customerId} 在 ${targetDate} 的状态`);
      return await this.statusHistoryService.getCustomerStatusAtTime(+customerId, targetDate);
    } catch (error) {
      this.logger.error(`查询客户状态失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '查询失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('batch-status-at-time')
  @ApiOperation({ 
    summary: '批量查询客户在指定时间点的状态', 
    description: '批量获取多个客户在特定日期的状态信息' 
  })
  @ApiQuery({ name: 'customerIds', description: '客户ID列表，用逗号分隔', example: '1,2,3' })
  @ApiQuery({ name: 'targetDate', description: '目标日期', example: '2025-01-15' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [CustomerStatusAtTimeDto]
  })
  async getMultipleCustomerStatusAtTime(
    @Query('customerIds') customerIds: string,
    @Query('targetDate') targetDate: string,
    @Request() req: any
  ): Promise<CustomerStatusAtTimeDto[]> {
    try {
      this.logger.log(`用户 ${req.user.id} 批量查询客户状态`);
      
      const ids = customerIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length === 0) {
        throw new Error('请提供有效的客户ID列表');
      }

      return await this.statusHistoryService.getMultipleCustomerStatusAtTime(ids, targetDate);
    } catch (error) {
      this.logger.error(`批量查询客户状态失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '查询失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 