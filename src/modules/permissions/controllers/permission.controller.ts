import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PermissionService } from '../services/permission.service';
import { UpdatePermissionDto, GetPermissionsQueryDto } from '../dto/permission.dto';
import { Permission } from '../entities/permission.entity';

@ApiTags('权限管理')
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

//   @Post()
//   @ApiOperation({ summary: '创建单个权限' })
//   @ApiResponse({ status: 201, description: '权限创建成功', type: Permission })
//   create(@Body() createPermissionDto: CreatePermissionDto) {
//     return this.permissionService.create(createPermissionDto);
//   }

//   @Post('batch')
//   @ApiOperation({ summary: '批量创建权限' })
//   @ApiResponse({ status: 201, description: '权限批量创建成功', type: [Permission] })
//   batchCreate(@Body() batchDto: BatchCreatePermissionDto) {
//     console.log('收到请求体:', JSON.stringify(batchDto));
//     return this.permissionService.batchCreate(batchDto);
//   }

  @Get()
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Permission] })
  findAll(@Query() query: GetPermissionsQueryDto) {
    return this.permissionService.findAll(query);
  }

//   @Get('by-page')
//   @ApiOperation({ summary: '获取按页面分组的权限列表' })
//   @ApiResponse({ status: 200, description: '获取成功' })
//   getPermissionsByPage() {
//     return this.permissionService.getPermissionsByPage();
//   }

//   @Get('unique')
//   @ApiOperation({ summary: '获取所有唯一的权限定义' })
//   @ApiResponse({ status: 200, description: '获取成功' })
//   getUniquePermissions() {
//     return this.permissionService.getUniquePermissions();
//   }

//   @Get(':id')
//   @ApiOperation({ summary: '获取指定权限' })
//   @ApiParam({ name: 'id', description: '权限ID' })
//   @ApiResponse({ status: 200, description: '获取成功', type: Permission })
//   findOne(@Param('id') id: string) {
//     return this.permissionService.findOne(+id);
//   }

  @Patch(':id')
  @ApiOperation({ summary: '更新权限值' })
  @ApiParam({ name: 'id', description: '权限ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Permission })
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(+id, updatePermissionDto);
  }

  @Get('check')
  @ApiOperation({ summary: '根据角色名称和权限名称获取权限值' })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功', 
    schema: {
      type: 'object',
      properties: {
        permission_value: { type: 'boolean' },
        permission: { type: 'object', nullable: true }
      }
    }
  })
  getPermissionValueByName(
    @Query('role_name') role_name: string,
    @Query('permission_name') permission_name: string
  ) {
    if (!role_name || !permission_name) {
      throw new BadRequestException('角色名称和权限名称不能为空');
    }
    
    return this.permissionService.getPermissionValueByName(
      String(role_name),
      String(permission_name)
    );
  }

//   @Delete(':id')
//   @ApiOperation({ summary: '删除权限' })
//   @ApiParam({ name: 'id', description: '权限ID' })
//   @ApiResponse({ status: 200, description: '删除成功' })
//   remove(@Param('id') id: string) {
//     return this.permissionService.remove(+id);
//   }
} 