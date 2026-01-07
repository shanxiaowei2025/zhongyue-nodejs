import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BusinessStatisticsService } from './business-statistics.service';
import { QueryBusinessStatisticsDto } from './dto/query-business-statistics.dto';
import { BusinessStatisticsResponseDto } from './dto/business-statistics-response.dto';

@ApiTags('业务统计')
@Controller('business-statistics')
export class BusinessStatisticsController {
  constructor(
    private readonly businessStatisticsService: BusinessStatisticsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '获取业务统计数据',
    description: '根据时间段和业务员筛选，统计各个业务费用的总计',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计数据成功',
    type: BusinessStatisticsResponseDto,
  })
  async getBusinessStatistics(
    @Query() query: QueryBusinessStatisticsDto,
  ): Promise<BusinessStatisticsResponseDto> {
    return this.businessStatisticsService.getBusinessStatistics(query);
  }

  @Get('by-location')
  @ApiOperation({
    summary: '获取按公司地点统计的业务统计数据',
    description: '根据时间段和业务员筛选，按公司地点分组统计各个业务费用的总计',
  })
  @ApiResponse({
    status: 200,
    description: '获取统计数据成功',
    type: BusinessStatisticsResponseDto,
  })
  async getBusinessStatisticsByLocation(
    @Query() query: QueryBusinessStatisticsDto,
  ): Promise<BusinessStatisticsResponseDto> {
    return this.businessStatisticsService.getBusinessStatisticsByLocation(query);
  }
}
