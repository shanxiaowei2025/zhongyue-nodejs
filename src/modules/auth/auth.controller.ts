// 认证控制器
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SalaryAuthDto, SetSalaryPasswordDto, ChangeSalaryPasswordDto } from './dto/salary-auth.dto';
import { SalaryVerifyResponseDto, SalaryPasswordStatusDto, SalaryPasswordOperationResponseDto } from './dto/salary-auth-response.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 用户登录
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名和密码登录系统',
  })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码不正确' })
  @ApiResponse({ status: 401, description: '该账号已禁用' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 获取当前用户信息
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息',
  })
  @ApiResponse({ status: 200, description: '成功获取用户信息' })
  @ApiResponse({ status: 401, description: '未授权的访问' })
  async getProfile(@Request() req) {
    // 获取完整的用户信息，包括密码更新时间
    const user = await this.authService.getUserProfile(req.user.id);
    return user;
  }

  // 更新当前用户信息
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新当前用户信息',
    description: '更新当前登录用户的个人资料（身份证和手机号）',
  })
  @ApiResponse({ status: 200, description: '成功更新用户信息' })
  @ApiResponse({ status: 401, description: '未授权的访问' })
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  // 修改密码
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '修改密码',
    description: '修改当前登录用户的密码，需要验证原密码',
  })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '原密码不正确或请求参数错误' })
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  // 薪资二级密码相关接口

  @ApiTags('薪资二级密码')
  @Post('salary/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '验证薪资密码',
    description: '验证薪资查看密码，成功后返回薪资访问令牌',
  })
  @ApiResponse({ 
    status: 200, 
    description: '验证成功，返回薪资访问令牌',
    type: SalaryVerifyResponseDto
  })
  @ApiResponse({ status: 400, description: '请先设置薪资查看密码' })
  @ApiResponse({ status: 401, description: '薪资密码不正确' })
  verifySalaryPassword(@Request() req, @Body() salaryAuthDto: SalaryAuthDto) {
    return this.authService.verifySalaryPassword(req.user.id, salaryAuthDto.salaryPassword);
  }

  @ApiTags('薪资二级密码')
  @Post('salary/set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '设置薪资密码',
    description: '首次设置薪资查看密码',
  })
  @ApiResponse({ 
    status: 200, 
    description: '设置成功',
    type: SalaryPasswordOperationResponseDto
  })
  @ApiResponse({ status: 400, description: '已设置薪资密码，请使用修改密码功能' })
  setSalaryPassword(@Request() req, @Body() setSalaryPasswordDto: SetSalaryPasswordDto) {
    return this.authService.setSalaryPassword(req.user.id, setSalaryPasswordDto.salaryPassword);
  }

  @ApiTags('薪资二级密码')
  @Post('salary/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '修改薪资密码',
    description: '修改薪资查看密码，需要验证当前薪资密码',
  })
  @ApiResponse({ 
    status: 200, 
    description: '修改成功',
    type: SalaryPasswordOperationResponseDto
  })
  @ApiResponse({ status: 400, description: '尚未设置薪资密码，请先设置密码' })
  @ApiResponse({ status: 401, description: '当前薪资密码不正确' })
  changeSalaryPassword(@Request() req, @Body() changeSalaryPasswordDto: ChangeSalaryPasswordDto) {
    return this.authService.changeSalaryPassword(
      req.user.id,
      changeSalaryPasswordDto.currentSalaryPassword,
      changeSalaryPasswordDto.newSalaryPassword,
    );
  }

  @ApiTags('薪资二级密码')
  @Get('salary/check-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '检查薪资密码状态',
    description: '检查当前用户是否已设置薪资密码',
  })
  @ApiResponse({ 
    status: 200, 
    description: '查询成功',
    type: SalaryPasswordStatusDto
  })
  checkSalaryPasswordStatus(@Request() req) {
    return this.authService.checkSalaryPasswordStatus(req.user.id);
  }
}
