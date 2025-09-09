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
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  SalaryAuthDto,
  SetSalaryPasswordDto,
  ChangeSalaryPasswordDto,
} from './dto/salary-auth.dto';
import {
  SalaryVerifyResponseDto,
  SalaryPasswordStatusDto,
  SalaryPasswordOperationResponseDto,
} from './dto/salary-auth-response.dto';

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
    type: SalaryVerifyResponseDto,
  })
  @ApiResponse({ status: 400, description: '请先设置薪资查看密码' })
  @ApiResponse({ status: 401, description: '薪资密码不正确' })
  verifySalaryPassword(@Request() req, @Body() salaryAuthDto: SalaryAuthDto) {
    return this.authService.verifySalaryPassword(
      req.user.id,
      salaryAuthDto.salaryPassword,
    );
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '设置薪资密码',
    description: '首次设置薪资查看密码，或在管理员重置后重新设置密码',
  })
  @ApiResponse({
    status: 200,
    description: '设置成功',
    type: SalaryPasswordOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '已设置薪资密码，请使用修改密码功能',
  })
  setSalaryPassword(
    @Request() req,
    @Body() setSalaryPasswordDto: SetSalaryPasswordDto,
  ) {
    return this.authService.setSalaryPassword(
      req.user.id,
      setSalaryPasswordDto.salaryPassword,
    );
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
    type: SalaryPasswordOperationResponseDto,
  })
  @ApiResponse({ status: 400, description: '尚未设置薪资密码，请先设置密码' })
  @ApiResponse({ status: 401, description: '当前薪资密码不正确' })
  changeSalaryPassword(
    @Request() req,
    @Body() changeSalaryPasswordDto: ChangeSalaryPasswordDto,
  ) {
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
    type: SalaryPasswordStatusDto,
  })
  checkSalaryPasswordStatus(@Request() req) {
    return this.authService.checkSalaryPasswordStatus(req.user.id);
  }

  @Patch('reset-password/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '重置用户薪资密码',
    description: '管理员专用：重置指定用户的薪资密码，清空salaryPassword和salaryPasswordUpdatedAt字段',
  })
  @ApiParam({
    name: 'userId',
    description: '要重置薪资密码的用户ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '重置成功',
    type: SalaryPasswordOperationResponseDto,
    example: {
      message: '用户薪资密码重置成功，用户需要重新设置薪资密码',
      timestamp: '2025-01-17T10:30:00.000Z',
    },
  })
  @ApiResponse({ status: 400, description: '用户不存在' })
  @ApiResponse({ status: 403, description: '权限不足，仅管理员可操作' })
  resetSalaryPassword(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.authService.resetSalaryPassword(userId, req.user);
  }
}
