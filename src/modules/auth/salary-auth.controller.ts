// 薪资二级密码控制器
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalaryAuthDto, SetSalaryPasswordDto, ChangeSalaryPasswordDto } from './dto/salary-auth.dto';
import { SalaryVerifyResponseDto, SalaryPasswordStatusDto, SalaryPasswordOperationResponseDto } from './dto/salary-auth-response.dto';

@ApiTags('薪资二级密码')
@Controller('auth/salary')
export class SalaryAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
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

  @Post('set-password')
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

  @Post('change-password')
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

  @Get('check-password')
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