// 认证服务
import { Injectable, UnauthorizedException } from '@nestjs/common';
// Injectable：标记这是一个可以被注入的服务
// UnauthorizedException：未授权异常，用于处理登录失败

import { JwtService } from '@nestjs/jwt';
// JWT服务：用于生成登录令牌

import { UsersService } from '../users/users.service';
// 用户服务：用于查询用户信息

import { LoginDto } from './dto/login.dto';
// 登录数据传输对象：定义登录需要的数据格式（用户名和密码）

@Injectable()  // 表示这是一个服务，可以被其他组件使用
export class AuthService {
  constructor(
    private usersService: UsersService, // 注入用户服务
    private jwtService: JwtService,     // 注入JWT服务
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
    const roles = Array.isArray(user.roles) ? user.roles : 
                  (user.roles ? [user.roles] : ['user']);
    
    // 4. 准备JWT载荷（payload）
    const payload = {
      username: user.username,  // 用户名
      sub: user.id,            // 用户ID
      roles: roles,            // 用户角色
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
        email: user.email,
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
    const { password: _, ...result } = user;
    return result;
  }
}
