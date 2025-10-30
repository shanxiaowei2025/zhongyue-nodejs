import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessOptionsService } from './business-options.service';
import { CreateBusinessOptionDto, UpdateBusinessOptionDto, QueryBusinessOptionDto } from './dto';
import { BusinessOption } from './entities/business-option.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * 业务选项控制器
 * 提供业务选项的完整CRUD接口
 */
@ApiTags('业务选项管理')
@Controller('business-options')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessOptionsController {
  constructor(private readonly businessOptionsService: BusinessOptionsService) {}

  /**
   * 创建业务选项
   * 需要管理员权限
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: '创建业务选项', 
    description: '创建一个新的业务选项（需要管理员权限）' 
  })
  @ApiResponse({ 
    status: 201, 
    description: '创建成功',
    type: BusinessOption,
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 409, description: '业务选项已存在' })
  async create(
    @Body() createDto: CreateBusinessOptionDto,
    @Req() req: any,
  ): Promise<BusinessOption> {
    const username = req.user?.username || 'unknown';
    return this.businessOptionsService.create(createDto, username);
  }

  /**
   * 获取业务选项列表（分页）
   */
  @Get()
  @ApiOperation({ 
    summary: '获取业务选项列表', 
    description: '分页查询业务选项列表,支持按类别和默认选项筛选' 
  })
  @ApiQuery({ 
    name: 'category', 
    required: false, 
    description: '业务类别',
    enum: ['change_business', 'administrative_license', 'other_business_basic', 'other_business_outsourcing', 'other_business_special'],
  })
  @ApiQuery({ 
    name: 'isDefault', 
    required: false, 
    description: '是否为默认选项',
    type: Boolean,
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: '页码',
    type: Number,
    example: 1,
  })
  @ApiQuery({ 
    name: 'pageSize', 
    required: false, 
    description: '每页数量',
    type: Number,
    example: 10,
  })
  @ApiResponse({ 
    status: 200, 
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        list: { type: 'array', items: { $ref: '#/components/schemas/BusinessOption' } },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        pageSize: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() queryDto: QueryBusinessOptionDto) {
    return this.businessOptionsService.findAll(queryDto);
  }

  /**
   * 根据类别获取业务选项
   */
  @Get('category/:category')
  @ApiOperation({ 
    summary: '根据类别获取业务选项', 
    description: '获取指定业务类别的所有选项' 
  })
  @ApiParam({ 
    name: 'category', 
    description: '业务类别',
    enum: ['change_business', 'administrative_license', 'other_business_basic', 'other_business_outsourcing', 'other_business_special'],
  })
  @ApiResponse({ 
    status: 200, 
    description: '查询成功',
    type: [BusinessOption],
  })
  @ApiResponse({ status: 401, description: '未授权' })
  async findByCategory(@Param('category') category: string): Promise<BusinessOption[]> {
    return this.businessOptionsService.findByCategory(category);
  }

  /**
   * 根据ID获取业务选项
   */
  @Get(':id')
  @ApiOperation({ 
    summary: '根据ID获取业务选项', 
    description: '获取指定ID的业务选项详情' 
  })
  @ApiParam({ name: 'id', description: '业务选项ID', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: '查询成功',
    type: BusinessOption,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '业务选项不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BusinessOption> {
    return this.businessOptionsService.findOne(id);
  }

  /**
   * 更新业务选项
   * 需要管理员权限
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ 
    summary: '更新业务选项', 
    description: '更新指定ID的业务选项（需要管理员权限）' 
  })
  @ApiParam({ name: 'id', description: '业务选项ID', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: '更新成功',
    type: BusinessOption,
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '业务选项不存在' })
  @ApiResponse({ status: 409, description: '业务选项值已存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBusinessOptionDto,
  ): Promise<BusinessOption> {
    return this.businessOptionsService.update(id, updateDto);
  }

  /**
   * 删除业务选项
   * 需要管理员权限
   * 不允许删除默认选项
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiOperation({ 
    summary: '删除业务选项', 
    description: '删除指定ID的业务选项（需要管理员权限，不能删除默认选项）' 
  })
  @ApiParam({ name: 'id', description: '业务选项ID', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: '删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '删除业务选项成功' },
        id: { type: 'number', example: 74 },
        deletedOption: {
          type: 'object',
          properties: {
            category: { type: 'string', example: 'change_business' },
            optionValue: { type: 'string', example: '选项名称' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足或不能删除默认选项' })
  @ApiResponse({ status: 404, description: '业务选项不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.businessOptionsService.remove(id);
  }
}

