import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionDto } from '../dto/role.dto';
import { Role } from '../entities/role.entity';

@ApiTags('角色管理')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '角色创建成功', type: Role })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Role] })
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: Role })
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色基本信息' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Role })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(+id, updateRoleDto);
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: '批量更新角色权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: Role })
  updatePermissions(@Param('id') id: string, @Body() updateDto: UpdateRolePermissionDto) {
    return this.roleService.updatePermissions(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.roleService.remove(+id);
  }
} 