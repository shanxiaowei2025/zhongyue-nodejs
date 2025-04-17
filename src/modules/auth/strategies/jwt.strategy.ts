// JWT认证策略
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    // 验证用户是否存在
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    
    // 使用JWT token中的角色信息，而不是从数据库中获取
    // 这样可以确保角色信息不会被篡改
    const roles = payload.roles || ['user'];
    
    return {
      id: user.id,
      username: user.username,
      roles: roles,  // 使用token中的角色，而不是数据库中的
      phone: user.phone,
      email: user.email,
    };
  }
}
