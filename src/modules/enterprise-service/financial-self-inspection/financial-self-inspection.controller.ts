import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FinancialSelfInspectionService } from './financial-self-inspection.service';
import { CreateFinancialSelfInspectionDto } from './dto/create-financial-self-inspection.dto';
import { CreateFinancialSelfInspectionRestrictedDto } from './dto/create-financial-self-inspection-restricted.dto';
import { QueryFinancialSelfInspectionDto } from './dto/query-financial-self-inspection.dto';
import { RectificationCompletionDto } from './dto/rectification-completion.dto';
import { InspectorConfirmationDto } from './dto/inspector-confirmation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('账务自查')
@Controller('enterprise-service/financial-self-inspection')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'bookkeepingAccountant', 'consultantAccountant')
@ApiBearerAuth()
export class FinancialSelfInspectionController {
  constructor(private readonly financialSelfInspectionService: FinancialSelfInspectionService) {}

  @Post()
  @ApiOperation({ summary: '创建账务自查记录（限制只能填写部分字段）' })
  create(@Body() createDto: CreateFinancialSelfInspectionRestrictedDto, @Request() req) {
    // 如果没有提供抽查人，则使用当前登录用户的用户名
    if (!createDto.inspector) {
      createDto.inspector = req.user.username;
    }
    return this.financialSelfInspectionService.create(createDto);
  }

  @Get('my-submitted')
  @ApiOperation({ summary: '查询我提交的记录（抽查人是当前用户）, 管理员和超级管理员可查看所有记录' })
  findMySubmitted(@Query() queryDto: QueryFinancialSelfInspectionDto, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.findMySubmitted(username, queryDto, isAdmin);
  }

  @Get('my-responsible')
  @ApiOperation({ summary: '查询我负责的记录（记账会计或顾问会计是当前用户）, 管理员和超级管理员可查看所有记录' })
  findMyResponsible(@Query() queryDto: QueryFinancialSelfInspectionDto, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.findMyResponsible(username, queryDto, isAdmin);
  }

  @Patch(':id/rectification-completion')
  @ApiOperation({ summary: '更新整改完成日期和整改结果' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateRectificationCompletion(@Param('id') id: string, @Body() dto: RectificationCompletionDto) {
    return this.financialSelfInspectionService.updateRectificationCompletion(+id, dto);
  }

  @Patch(':id/inspector-confirmation')
  @ApiOperation({ summary: '更新抽查人确认（只能修改抽查人确认和备注字段）' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateInspectorConfirmation(@Param('id') id: string, @Body() dto: InspectorConfirmationDto) {
    return this.financialSelfInspectionService.updateInspectorConfirmation(+id, dto);
  }
} 