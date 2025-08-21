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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CustomerLevelHistoryService } from './customer-level-history.service';
import { CreateLevelHistoryDto } from './dto/create-level-history.dto';
import { QueryLevelHistoryDto } from './dto/query-level-history.dto';
import { LevelHistoryResponseDto } from './dto/level-history-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('客户等级历史管理')
@Controller('reports/customer-level-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true }))
export class CustomerLevelHistoryController {
  private readonly logger = new Logger(CustomerLevelHistoryController.name);

  constructor(
    private readonly levelHistoryService: CustomerLevelHistoryService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ 
    summary: '创建客户等级历史记录', 
    description: '手动创建客户等级变更历史记录（管理员功能）' 
  })
  @ApiResponse({
    status: 201,
    description: '成功创建客户等级历史记录',
  })
  async createLevelHistory(
    @Body() createDto: CreateLevelHistoryDto,
    @Request() req: any,
  ) {
    try {
      this.logger.log(`用户 ${req.user.id} 创建客户等级历史记录`);
      
      // 设置操作人员
      if (!createDto.changedBy) {
        createDto.changedBy = req.user.username || `用户${req.user.id}`;
      }

      const result = await this.levelHistoryService.createLevelHistory(createDto);
      return {
        message: '客户等级历史记录创建成功',
        data: result,
      };
    } catch (error) {
      this.logger.error(`创建客户等级历史记录失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '创建客户等级历史记录失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ 
    summary: '查询客户等级历史记录', 
    description: '根据条件查询客户等级变更历史记录' 
  })
  @ApiResponse({
    status: 200,
    description: '成功返回客户等级历史记录列表',
    type: LevelHistoryResponseDto,
  })
  async findLevelHistory(
    @Query() query: QueryLevelHistoryDto,
    @Request() req: any,
  ): Promise<LevelHistoryResponseDto> {
    try {
      this.logger.log(`用户 ${req.user.id} 查询客户等级历史记录`);
      return await this.levelHistoryService.findLevelHistory(query);
    } catch (error) {
      this.logger.error(`查询客户等级历史记录失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '查询客户等级历史记录失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('customer/:customerId')
  @ApiOperation({ 
    summary: '查询特定客户的等级历史', 
    description: '根据客户ID查询该客户的所有等级变更历史' 
  })
  @ApiParam({ name: 'customerId', description: '客户ID' })
  @ApiResponse({
    status: 200,
    description: '成功返回指定客户的等级历史记录',
  })
  async findByCustomerId(
    @Param('customerId') customerId: number,
    @Request() req: any,
  ) {
    try {
      this.logger.log(`用户 ${req.user.id} 查询客户 ${customerId} 的等级历史`);
      const records = await this.levelHistoryService.findByCustomerId(+customerId);
      
      return {
        message: '查询成功',
        data: records,
        total: records.length,
      };
    } catch (error) {
      this.logger.error(
        `查询客户 ${customerId} 的等级历史失败: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || '查询客户等级历史失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('level-at-time')
  @ApiOperation({ 
    summary: '查询指定时间点的客户等级', 
    description: '获取客户在指定日期的等级状态' 
  })
  @ApiResponse({
    status: 200,
    description: '成功返回指定时间点的客户等级',
  })
  async getCustomerLevelAtTime(
    @Query('customerId') customerId: number,
    @Query('targetDate') targetDate: string,
    @Request() req: any,
  ) {
    try {
      this.logger.log(
        `用户 ${req.user.id} 查询客户 ${customerId} 在 ${targetDate} 的等级`,
      );

      if (!customerId || !targetDate) {
        throw new HttpException(
          '客户ID和目标日期不能为空',
          HttpStatus.BAD_REQUEST,
        );
      }

      const level = await this.levelHistoryService.getCustomerLevelAtTime(
        +customerId,
        new Date(targetDate),
      );

      return {
        message: '查询成功',
        data: {
          customerId: +customerId,
          targetDate,
          levelAtTime: level,
        },
      };
    } catch (error) {
      this.logger.error(
        `查询客户 ${customerId} 在 ${targetDate} 的等级失败: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || '查询客户指定时间等级失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 