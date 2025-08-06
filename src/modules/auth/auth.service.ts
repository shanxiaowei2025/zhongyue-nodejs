// 认证服务
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
// Injectable：标记这是一个可以被注入的服务
// UnauthorizedException：未授权异常，用于处理登录失败
// BadRequestException：错误请求异常，用于处理输入数据问题

import { JwtService } from '@nestjs/jwt';
// JWT服务：用于生成登录令牌

import { UsersService } from '../users/users.service';
// 用户服务：用于查询用户信息

import { LoginDto } from './dto/login.dto';
// 登录数据传输对象：定义登录需要的数据格式（用户名和密码）
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SalaryAuthDto, SetSalaryPasswordDto, ChangeSalaryPasswordDto } from './dto/salary-auth.dto';
// 更新个人资料数据传输对象：定义更新个人资料需要的数据格式

@Injectable() // 表示这是一个服务，可以被其他组件使用
export class AuthService {
  constructor(
    private usersService: UsersService, // 注入用户服务
    private jwtService: JwtService, // 注入JWT服务
  ) {}

  // 用户登录
  async login(loginDto: LoginDto) {
    try {
    // 1. 验证用户名和密码
    const user = await this.validateUser(loginDto.username, loginDto.password);

    // 2. 如果验证失败，抛出异常
    if (!user) {
      throw new UnauthorizedException('用户名或密码不正确');
    }

    // 3. 处理用户角色
    // 确保roles是数组格式，如果不是，转换成数组
    const roles = Array.isArray(user.roles)
      ? user.roles
      : user.roles
        ? [user.roles]
        : ['user'];

    // 4. 准备JWT载荷（payload）
    const payload = {
      username: user.username, // 用户名
      sub: user.id, // 用户ID
      roles: roles, // 用户角色
    };

    // 5. 返回登录结果
    return {
      // 生成JWT令牌
      access_token: this.jwtService.sign(payload),
      // 返回用户信息
      user_info: {
        id: user.id,
        username: user.username,
        roles: roles,
        phone: user.phone,
        idCardNumber: user.idCardNumber,
        avatar: user.avatar,
        passwordUpdatedAt: user.passwordUpdatedAt,
      },
    };
    } catch (error) {
      // 捕获并重新抛出异常，保持原始错误消息
      throw error;
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    // 1. 根据用户名查找用户
    const user = await this.usersService.findByUsername(username);

    // 2. 如果用户不存在，返回null
    if (!user) {
      return null;
    }

    // 检查用户账号是否被禁用
    if (!user.isActive) {
      throw new UnauthorizedException('该账号已禁用');
    }

    // 3. 验证密码
    const isPasswordValid = await user.validatePassword(password);

    // 4. 如果密码错误，返回null
    if (!isPasswordValid) {
      return null;
    }

    // 5. 密码正确，返回用户信息（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  // 更新用户个人资料（只允许更新idCardNumber和phone）
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    // 更新idCardNumber、phone和avatar字段
    const updatedUser = await this.usersService.updateUserProfile(userId, {
      idCardNumber: updateProfileDto.idCardNumber,
      phone: updateProfileDto.phone,
      avatar: updateProfileDto.avatar,
    });

    return {
      message: '个人资料更新成功',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        idCardNumber: updatedUser.idCardNumber,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      },
    };
  }

  // 修改密码
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // 1. 获取用户信息
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 2. 验证原密码是否正确
    const isPasswordValid = await user.validatePassword(
      changePasswordDto.oldPassword,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('原密码不正确');
    }

    // 3. 更新密码
    await this.usersService.updatePassword(
      userId,
      changePasswordDto.newPassword,
    );

    return {
      message: '密码修改成功',
      data: null,
    };
  }

  // 获取用户完整资料（包含密码更新时间）
  async getUserProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      roles: user.roles,
      phone: user.phone,
      idCardNumber: user.idCardNumber,
      avatar: user.avatar,
      passwordUpdatedAt: user.passwordUpdatedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // 薪资二级密码相关方法

  /**
   * 验证薪资密码并生成临时访问令牌
   * @param userId 用户ID
   * @param salaryPassword 薪资密码
   * @returns 薪资访问令牌和过期时间
   */
  async verifySalaryPassword(userId: number, salaryPassword: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 检查是否设置了薪资密码
    if (!user.salaryPassword) {
      throw new BadRequestException('请先设置薪资查看密码');
    }
    
    // 验证薪资密码
    const isValid = await this.usersService.validateSalaryPassword(userId, salaryPassword);
    if (!isValid) {
      throw new UnauthorizedException('薪资密码不正确');
    }
    
    // 生成薪资访问令牌（短期有效，30分钟）
    const salaryPayload = {
      userId: user.id,
      username: user.username,
      type: 'salary_access',
      iat: Math.floor(Date.now() / 1000),
    };
    
    const salarySecret = process.env.SALARY_JWT_SECRET || process.env.JWT_SECRET + '_salary';
    
    return {
      salaryAccessToken: this.jwtService.sign(salaryPayload, {
        expiresIn: '30m', // 30分钟有效期
        secret: salarySecret,
      }),
      expiresIn: 30 * 60, // 30分钟（秒）
      message: '薪资访问权限验证成功',
    };
  }

  /**
   * 设置薪资密码（首次设置）
   * @param userId 用户ID
   * @param salaryPassword 薪资密码
   * @returns 设置结果
   */
  async setSalaryPassword(userId: number, salaryPassword: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 检查是否已设置薪资密码
    const hasPassword = await this.usersService.hasSalaryPassword(userId);
    if (hasPassword) {
      throw new BadRequestException('已设置薪资密码，请使用修改密码功能');
    }
    
    // 加密薪资密码
    const hashedPassword = await this.hashPassword(salaryPassword);
    
    // 保存薪资密码
    await this.usersService.updateSalaryPassword(userId, {
      salaryPassword: hashedPassword,
      salaryPasswordUpdatedAt: new Date(),
    });
    
    return { 
      message: '薪资密码设置成功',
      timestamp: new Date()
    };
  }

  /**
   * 修改薪资密码
   * @param userId 用户ID
   * @param currentPassword 当前薪资密码
   * @param newPassword 新薪资密码
   * @returns 修改结果
   */
  async changeSalaryPassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 检查是否已设置薪资密码
    const hasPassword = await this.usersService.hasSalaryPassword(userId);
    if (!hasPassword) {
      throw new BadRequestException('尚未设置薪资密码，请先设置密码');
    }

    // 验证当前薪资密码
    const isCurrentValid = await this.usersService.validateSalaryPassword(userId, currentPassword);
    if (!isCurrentValid) {
      throw new UnauthorizedException('当前薪资密码不正确');
    }
    
    // 加密新薪资密码
    const hashedNewPassword = await this.hashPassword(newPassword);
    
    // 更新薪资密码
    await this.usersService.updateSalaryPassword(userId, {
      salaryPassword: hashedNewPassword,
      salaryPasswordUpdatedAt: new Date(),
    });
    
    return { 
      message: '薪资密码修改成功',
      timestamp: new Date()
    };
  }

  /**
   * 检查薪资密码状态
   * @param userId 用户ID
   * @returns 薪资密码状态信息
   */
  async checkSalaryPasswordStatus(userId: number) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return await this.usersService.getSalaryPasswordInfo(userId);
  }

  /**
   * 加密密码的通用方法
   * @param password 原始密码
   * @returns 加密后的密码
   */
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcryptjs');
    return bcrypt.hash(password, 10);
  }
}
