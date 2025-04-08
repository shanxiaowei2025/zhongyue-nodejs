import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码不正确');
    }
    
    // 确保roles是数组
    const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : ['user']);
    
    const payload = {
      username: user.username,
      sub: user.id,
      roles: roles,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
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
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // 不返回password字段
    const { password: _, ...result } = user;
    return result;
  }
}
