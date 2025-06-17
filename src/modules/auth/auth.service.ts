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
// 更新个人资料数据传输对象：定义更新个人资料需要的数据格式

@Injectable() // 表示这是一个服务，可以被其他组件使用
export class AuthService {
  constructor(
    private usersService: UsersService, // 注入用户服务
    private jwtService: JwtService, // 注入JWT服务
  ) {}

  // 用户登录
  async login(loginDto: LoginDto) {
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
        passwordUpdatedAt: user.passwordUpdatedAt,
      },
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    // 1. 根据用户名查找用户
    const user = await this.usersService.findByUsername(username);

    // 2. 如果用户不存在，返回null
    if (!user) {
      return null;
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
    // 只更新idCardNumber和phone字段
    const updatedUser = await this.usersService.updateUserProfile(userId, {
      idCardNumber: updateProfileDto.idCardNumber,
      phone: updateProfileDto.phone,
    });

    return {
      message: '个人资料更新成功',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        idCardNumber: updatedUser.idCardNumber,
        phone: updatedUser.phone,
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
      passwordUpdatedAt: user.passwordUpdatedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
