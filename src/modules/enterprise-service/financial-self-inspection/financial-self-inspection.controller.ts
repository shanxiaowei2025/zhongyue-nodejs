import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FinancialSelfInspectionService } from './financial-self-inspection.service';
import { CreateFinancialSelfInspectionDto } from './dto/create-financial-self-inspection.dto';
import { CreateFinancialSelfInspectionRestrictedDto } from './dto/create-financial-self-inspection-restricted.dto';
import { QueryFinancialSelfInspectionDto } from './dto/query-financial-self-inspection.dto';
import { RectificationCompletionDto } from './dto/rectification-completion.dto';
import { ApprovalDto } from './dto/approval.dto';
import { ReviewerApprovalDto } from './dto/reviewer-approval.dto';
import { RejectDto } from './dto/reject.dto';
import { ReviewerRejectDto } from './dto/reviewer-reject.dto';
import { QueryInspectorCountDto } from './dto/query-inspector-count.dto';
import { QueryReviewerCountDto } from './dto/query-reviewer-count.dto';
import { CountResponseDto } from './dto/count-response.dto';
import { CountByUserResponseDto } from './dto/count-by-user-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@ApiTags('账务自查')
@Controller('enterprise-service/financial-self-inspection')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'bookkeepingAccountant', 'consultantAccountant')
@ApiBearerAuth()
export class FinancialSelfInspectionController {
  private readonly logger = new Logger(FinancialSelfInspectionController.name);
  constructor(private readonly financialSelfInspectionService: FinancialSelfInspectionService) {}

  @Post()
  @ApiOperation({ 
    summary: '创建账务自查记录（限制只能填写部分字段）',
    description: '创建账务自查记录时会进行职级检查：1.如果记账会计是当前用户自己，允许创建；2.如果当前用户职级高于记账会计，允许创建；3.如果双方都是P4职级，允许创建；4.其他情况不允许创建'
  })
  create(@Body() createDto: CreateFinancialSelfInspectionRestrictedDto, @Request() req) {
    // 如果没有提供抽查人，则使用当前登录用户的用户名
    if (!createDto.inspector) {
      createDto.inspector = req.user.username;
    }
    // 传递当前用户名，用于职级检查
    return this.financialSelfInspectionService.create(createDto, req.user.username);
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
  @Roles('admin', 'super_admin') // 只有管理员和超级管理员可以调用
  @ApiOperation({ summary: '查询我复查的记录【仅管理员】' })
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
  @Roles('admin', 'super_admin') // 只有管理员和超级管理员可以调用
  @ApiOperation({ summary: '查看我复查的记录详情【仅管理员】' })
  @ApiParam({ name: 'id', description: '记录ID' })
  findMyReviewedDetail(@Param('id') id: string, @Request() req) {
    const username = req.user.username;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    return this.financialSelfInspectionService.findMyReviewedOne(+id, username, isAdmin);
  }

  @Patch(':id/rectification-completion')
  @ApiOperation({ summary: '更新整改记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  async updateRectificationCompletion(
    @Param('id') id: string, 
    @Body() dto: RectificationCompletionDto
  ) {
    this.logger.debug(`接收到整改记录: ${JSON.stringify(dto.rectificationRecords)}`);
    
    // 确保DTO中的数据结构正确
    if (!dto.rectificationRecords || !Array.isArray(dto.rectificationRecords)) {
      throw new BadRequestException('整改记录必须是数组');
    }
    
    return this.financialSelfInspectionService.updateRectificationCompletion(+id, dto);
  }

  @Patch(':id/approval')
  @ApiOperation({ summary: '添加审核通过记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  async updateApproval(
    @Param('id') id: string, 
    @Body() dto: ApprovalDto
  ) {
    this.logger.debug(`接收到审核通过记录: ${JSON.stringify(dto.approvalRecords)}`);
    
    // 确保DTO中的数据结构正确
    if (!dto.approvalRecords || !Array.isArray(dto.approvalRecords)) {
      throw new BadRequestException('审核通过记录必须是数组');
    }
    
    return this.financialSelfInspectionService.updateApproval(+id, dto);
  }

  @Patch(':id/reviewer-approval')
  @ApiOperation({ summary: '添加复查审核通过记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  async updateReviewerApproval(
    @Param('id') id: string, 
    @Body() dto: ReviewerApprovalDto, 
    @Request() req
  ) {
    this.logger.debug(`接收到复查审核通过记录: ${JSON.stringify(dto.reviewerApprovalRecords)}`);
    
    // 确保DTO中的数据结构正确
    if (!dto.reviewerApprovalRecords || !Array.isArray(dto.reviewerApprovalRecords)) {
      throw new BadRequestException('复查审核通过记录必须是数组');
    }
    
    const username = req.user.username;
    return this.financialSelfInspectionService.updateReviewerApproval(+id, dto, username);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: '添加审核退回记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  async updateReject(
    @Param('id') id: string, 
    @Body() dto: RejectDto
  ) {
    this.logger.debug(`接收到审核退回记录: ${JSON.stringify(dto.rejectRecords)}`);
    
    // 确保DTO中的数据结构正确
    if (!dto.rejectRecords || !Array.isArray(dto.rejectRecords)) {
      throw new BadRequestException('审核退回记录必须是数组');
    }
    
    return this.financialSelfInspectionService.updateReject(+id, dto);
  }

  @Patch(':id/reviewer-reject')
  @ApiOperation({ summary: '添加复查审核退回记录' })
  @ApiParam({ name: 'id', description: '记录ID' })
  async updateReviewerReject(
    @Param('id') id: string, 
    @Body() dto: ReviewerRejectDto, 
    @Request() req
  ) {
    this.logger.debug(`接收到复查审核退回记录: ${JSON.stringify(dto.reviewerRejectRecords)}`);
    
    // 确保DTO中的数据结构正确
    if (!dto.reviewerRejectRecords || !Array.isArray(dto.reviewerRejectRecords)) {
      throw new BadRequestException('复查审核退回记录必须是数组');
    }
    
    const username = req.user.username;
    return this.financialSelfInspectionService.updateReviewerReject(+id, dto, username);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin') // 只有管理员和超级管理员可以调用
  @ApiOperation({ 
    summary: '删除账务自查记录【仅管理员】',
    description: '删除指定ID的账务自查记录，需要管理员或超级管理员权限。'
  })
  @ApiParam({ 
    name: 'id', 
    description: '记录ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '删除成功' 
  })
  @ApiResponse({ 
    status: 403, 
    description: '权限不足，需要管理员权限' 
  })
  @ApiResponse({ 
    status: 404, 
    description: '记录不存在' 
  })
  remove(@Param('id') id: string) {
    return this.financialSelfInspectionService.remove(+id);
  }

  @Get('count-as-inspector')
  @Roles('admin', 'super_admin') // 只有管理员和超级管理员可以调用
  @ApiOperation({ 
    summary: '统计每个用户作为抽查人的记录数量【仅管理员】',
    description: '根据日期范围统计每个用户作为抽查人的记录数量，返回每个用户的统计数和总数。如果使用相同的开始日期和结束日期，会统计整天的数据。需要管理员或超级管理员权限。'
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
    type: CountByUserResponseDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: '权限不足，需要管理员权限' 
  })
  countAsInspector(@Query() queryDto: QueryInspectorCountDto) {
    return this.financialSelfInspectionService.countAsInspector(
      queryDto.startDate, 
      queryDto.endDate
    );
  }

  @Get('count-as-reviewer')
  @Roles('admin', 'super_admin') // 只有管理员和超级管理员可以调用
  @ApiOperation({ 
    summary: '统计每个用户作为复查人的记录数量【仅管理员】',
    description: '根据日期范围统计每个用户作为复查人的记录数量，返回每个用户的统计数和总数。如果使用相同的开始日期和结束日期，会统计整天的数据。需要管理员或超级管理员权限。'
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
    type: CountByUserResponseDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: '权限不足，需要管理员权限' 
  })
  countAsReviewer(@Query() queryDto: QueryReviewerCountDto) {
    return this.financialSelfInspectionService.countAsReviewer(
      queryDto.startDate, 
      queryDto.endDate
    );
  }
} 