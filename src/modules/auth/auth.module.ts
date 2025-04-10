// 认证模块的入口文件
// 导入需要的工具和模块
import { Module } from '@nestjs/common';  // 用来声明这是一个模块
import { JwtModule } from '@nestjs/jwt';  // JWT工具，用来生成和验证登录令牌
import { PassportModule } from '@nestjs/passport';  // 用于处理认证的工具
import { ConfigModule, ConfigService } from '@nestjs/config';  // 用于读取配置
import { AuthService } from './auth.service';  // 认证相关的业务逻辑
import { JwtStrategy } from './strategies/jwt.strategy';  // JWT认证策略
import { UsersModule } from '../users/users.module';  // 用户模块
import { AuthController } from './auth.controller';  // 处理认证相关的请求

@Module({
  imports: [
    // 1. 导入用户模块，因为认证需要查询用户信息
    UsersModule,  // 比如登录时需要查询用户是否存在

    // 2. 导入认证模块
    PassportModule,  // 这是一个认证框架，帮助我们实现各种认证方式

    // 3. 配置JWT模块（最重要的部分）
    JwtModule.registerAsync({
      imports: [ConfigModule],  // 导入配置模块
      inject: [ConfigService],  // 注入配置服务
      useFactory: (configService: ConfigService) => ({
        // 从配置文件读取JWT密钥
        secret: configService.get('jwt.secret'),
        // 设置token过期时间
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
    }),
  ],

  // 4. 声明服务提供者（处理具体的业务逻辑）
  providers: [
    AuthService,    // 处理登录、注册等业务
    JwtStrategy,    // 处理JWT验证的策略
  ],

  // 5. 声明控制器（处理HTTP请求）
  controllers: [AuthController],

  // 6. 导出服务（允许其他模块使用认证服务）
  exports: [AuthService],
})
export class AuthModule {}
