// 认证控制器
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '../../common/swagger';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 用户登录
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录系统' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码不正确' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 获取当前用户信息
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息', description: '获取当前登录用户的详细信息' })
  @ApiResponse({ status: 200, description: '成功获取用户信息' })
  @ApiResponse({ status: 401, description: '未授权的访问' })
  getProfile(@Request() req) {
    return req.user;
  }
}
