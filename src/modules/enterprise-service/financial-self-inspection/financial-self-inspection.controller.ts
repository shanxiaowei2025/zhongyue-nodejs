import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FinancialSelfInspectionService } from './financial-self-inspection.service';
import { CreateFinancialSelfInspectionDto } from './dto/create-financial-self-inspection.dto';
import { CreateFinancialSelfInspectionRestrictedDto } from './dto/create-financial-self-inspection-restricted.dto';
import { QueryFinancialSelfInspectionDto } from './dto/query-financial-self-inspection.dto';
import { RectificationCompletionDto } from './dto/rectification-completion.dto';
import { InspectorConfirmationDto } from './dto/inspector-confirmation.dto';
import { ReviewerConfirmationDto } from './dto/reviewer-confirmation.dto';
import { ReviewerRectificationCompletionDto } from './dto/reviewer-rectification-completion.dto';
import { UpdateReviewerFieldsDto } from './dto/update-reviewer-fields.dto';
import { QueryInspectorCountDto } from './dto/query-inspector-count.dto';
import { QueryReviewerCountDto } from './dto/query-reviewer-count.dto';
import { CountResponseDto } from './dto/count-response.dto';
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

  @Get('my-reviewed')
  @ApiOperation({ summary: '查询我负责复查的记录（抽查人是当前用户的下级）, 管理员和超级管理员可查看所有记录' })
  findMyReviewed(@Query() queryDto: QueryFinancialSelfInspectionDto, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.findMyReviewed(username, queryDto, isAdmin);
  }

  @Get('my-submitted/:id')
  @ApiOperation({ summary: '查看我提交的记录详情' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findMySubmittedDetail(@Param('id') id: string, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.findMySubmittedOne(+id, username, isAdmin);
  }

  @Get('my-responsible/:id')
  @ApiOperation({ summary: '查看我负责的记录详情' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findMyResponsibleDetail(@Param('id') id: string, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.findMyResponsibleOne(+id, username, isAdmin);
  }

  @Get('my-reviewed/:id')
  @ApiOperation({ summary: '查看我负责复查的记录详情（抽查人是当前用户的下级）' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findMyReviewedDetail(@Param('id') id: string, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.findMyReviewedOne(+id, username, isAdmin);
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

  @Patch(':id/reviewer-rectification-completion')
  @ApiOperation({ summary: '更新复查整改完成日期和复查整改结果' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateReviewerRectificationCompletion(@Param('id') id: string, @Body() dto: ReviewerRectificationCompletionDto) {
    return this.financialSelfInspectionService.updateReviewerRectificationCompletion(+id, dto);
  }

  @Patch(':id/reviewer-confirmation')
  @ApiOperation({ summary: '更新复查人确认（只能修改复查人确认和复查备注字段）' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateReviewerConfirmation(@Param('id') id: string, @Body() dto: ReviewerConfirmationDto, @Request() req) {
    console.log('收到复查人确认请求，请求体:', JSON.stringify(dto));
    console.log('请求参数ID:', id);
    console.log('请求用户:', req.user?.username);
    
    // 确保有效的请求体
    if (!dto || !dto.reviewerConfirmation) {
      console.error('请求体无效或缺少必要参数');
      throw new Error('请求参数不完整，复查人确认日期必须提供');
    }
    
    return this.financialSelfInspectionService.updateReviewerConfirmation(+id, dto);
  }

  @Patch(':id/reviewer-fields')
  @ApiOperation({ summary: '更新复查问题和解决方案，自动将当前用户设为复查人' })
  @ApiParam({ name: 'id', description: '记录ID' })
  updateReviewerFields(@Param('id') id: string, @Body() dto: UpdateReviewerFieldsDto, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.updateReviewerFields(+id, dto, username, isAdmin);
  }

  @Get('count-as-inspector')
  @ApiOperation({ 
    summary: '统计当前用户作为抽查人的记录数量',
    description: '根据日期范围统计当前用户作为抽查人的记录数量，返回符合条件的记录总数。如果使用相同的开始日期和结束日期，会统计整天的数据。'
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: '抽查人确认开始日期（格式：YYYY-MM-DD）',
    example: '2023-01-01'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: '抽查人确认结束日期（格式：YYYY-MM-DD）',
    example: '2023-12-31'
  })
  @ApiResponse({ 
    status: 200, 
    description: '统计成功', 
    type: CountResponseDto 
  })
  countAsInspector(@Query() queryDto: QueryInspectorCountDto, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.countAsInspector(
      username, 
      queryDto.startDate, 
      queryDto.endDate, 
      isAdmin
    );
  }

  @Get('count-as-reviewer')
  @ApiOperation({ 
    summary: '统计当前用户作为复查人的记录数量',
    description: '根据日期范围统计当前用户作为复查人的记录数量，返回符合条件的记录总数。如果使用相同的开始日期和结束日期，会统计整天的数据。'
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: '复查人确认开始日期（格式：YYYY-MM-DD）',
    example: '2023-01-01'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: '复查人确认结束日期（格式：YYYY-MM-DD）',
    example: '2023-12-31'
  })
  @ApiResponse({ 
    status: 200, 
    description: '统计成功', 
    type: CountResponseDto 
  })
  countAsReviewer(@Query() queryDto: QueryReviewerCountDto, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.countAsReviewer(
      username, 
      queryDto.startDate, 
      queryDto.endDate, 
      isAdmin
    );
  }
} 