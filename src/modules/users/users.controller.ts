import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @Roles('super_admin', 'admin')
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @Roles('super_admin', 'admin')
  findAll(@Query('page') page = 1, @Query('limit') limit = 10, @Request() req) {
    return this.usersService.findAll(page, limit, req.user);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索用户', description: '支持按用户名模糊查询' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @Roles('super_admin', 'admin')
  searchUsers(@Query() queryUserDto: QueryUserDto, @Request() req) {
    return this.usersService.searchUsers(queryUserDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @Roles('super_admin', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @Roles('super_admin', 'admin')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @Roles('super_admin', 'admin')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.remove(id, req.user);
  }
} 