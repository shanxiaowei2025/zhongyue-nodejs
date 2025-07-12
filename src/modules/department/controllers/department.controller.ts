import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DepartmentService } from '../services/department.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentTreeNode,
  DepartmentQueryDto,
} from '../dto/department.dto';
import { Department } from '../entities/department.entity';
import { BulkDeleteDto } from '../dto/department.dto';

@ApiTags('部门管理')
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @ApiOperation({ summary: '创建部门' })
  @ApiResponse({ status: 201, description: '部门创建成功', type: Department })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: '获取部门列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Department] })
  findAll(@Query() query: DepartmentQueryDto) {
    return this.departmentService.findAll(query);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取部门树形结构' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [DepartmentTreeNode],
  })
  getTreeList() {
    return this.departmentService.getTreeList();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定部门' })
  @ApiParam({ name: 'id', description: '部门ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: Department })
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(+id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: '获取部门下的用户列表' })
  @ApiParam({ name: 'id', description: '部门ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getDepartmentUsers(@Param('id') id: string) {
    return this.departmentService.getDepartmentUsers(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新部门' })
  @ApiParam({ name: 'id', description: '部门ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Department })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  @ApiParam({ name: 'id', description: '部门ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.departmentService.remove(+id);
  }

  @Post('bulk-delete')
  @HttpCode(200)
  @ApiOperation({ summary: '批量删除部门' })
  @ApiResponse({
    status: 200,
    description: '批量删除结果',
    schema: {
      properties: {
        success: { type: 'number', description: '成功删除的数量' },
        failed: { type: 'number', description: '删除失败的数量' },
      },
    },
  })
  bulkRemove(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.departmentService.bulkRemove(bulkDeleteDto.ids);
  }
}
