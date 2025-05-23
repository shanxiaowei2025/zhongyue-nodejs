// 主模块文件
// 导入我们需要的工具和模块
import { Module } from '@nestjs/common'; // 这是用来声明模块的装饰器
import { ConfigModule, ConfigService } from '@nestjs/config'; // 这是用来管理配置的模块
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller'; // 主控制器
import { AppService } from './app.service'; // 主服务
import { DatabaseModule } from './database/database.module'; // 数据库模块
import { UsersModule } from './modules/users/users.module'; // 用户模块
import { AuthModule } from './modules/auth/auth.module'; // 认证模块
import { CustomerModule } from './modules/customer/customer.module'; // 客户模块
import { StorageModule } from './modules/storage/storage.module';
import { RolesModule } from './modules/roles/roles.module'; // 新增
import { PermissionsModule } from './modules/permissions/permissions.module'; // 新增
import { DepartmentModule } from './modules/department/department.module';
import { ExpenseModule } from './modules/expense/expense.module'; // 新增费用管理模块
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

// 导入各种配置文件
import appConfig from './config/app.config'; // 应用配置
import databaseConfig from './config/database.config'; // 数据库配置
import jwtConfig from './config/jwt.config'; // JWT认证配置
import * as Joi from 'joi'; // 用于验证配置的工具

// 导入实体
import { User } from './modules/users/entities/user.entity';
import { Customer } from './modules/customer/entities/customer.entity';

import { Role } from './modules/roles/entities/role.entity'; // 路径已修改
import { Permission } from './modules/permissions/entities/permission.entity'; // 路径已修改
import { Department } from './modules/department/entities/department.entity';
import { Expense } from './modules/expense/entities/expense.entity'; // 新增费用实体

@Module({
  imports: [
    ConfigModule.forRoot({
      // 配置模块的设置
      isGlobal: true, // 设置为全局模块，这样其他模块都能使用这些配置
      load: [appConfig, databaseConfig, jwtConfig], // 加载各种配置文件
      validationSchema: Joi.object({
        // 验证配置的规则
        // 应用配置
        APP_PORT: Joi.number().default(3000), // 端口号，默认3000
        APP_ENV: Joi.string()
          .valid('development', 'production', 'test') // 环境只能是这三种
          .default('development'), // 默认是开发环境

        // 数据库配置
        DB_HOST: Joi.string().default('localhost'), // 数据库地址
        DB_PORT: Joi.number().default(3306), // 数据库端口
        DB_USERNAME: Joi.string().required(), // 数据库用户名（必填）
        DB_PASSWORD: Joi.string().required(), // 数据库密码（必填）
        DB_DATABASE: Joi.string().required(), // 数据库名（必填）

        // JWT配置
        JWT_SECRET: Joi.string().required(), // JWT密钥（必填）
        JWT_EXPIRES_IN: Joi.string().default('1d'), // Token过期时间，默认1天

        // 其他配置
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug') // 日志级别
          .default('info'), // 默认info级别
        CORS_ORIGIN: Joi.string().default('*'), // 允许访问的域名，默认允许所有
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'zhongyue'),
        entities: [
          User,
          Customer,
          Role,
          Permission,
          Department,
          Expense,
        ],
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
      }),
    }),
    // 导入各个功能模块
    DatabaseModule, // 数据库模块：负责连接和操作数据库
    DepartmentModule,
    RolesModule, // 新增
    UsersModule, // 用户模块：处理用户相关的功能
    PermissionsModule, // 新增
    AuthModule, // 认证模块：处理登录、注册、权限
    CustomerModule, // 客户模块：处理客户相关的功能
    StorageModule,
    ExpenseModule, // 新增费用管理模块
  ],
  controllers: [AppController], // 控制器：负责接收请求，像前台接待
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ], // 服务：负责具体业务逻辑，像后台工作人员
})
export class AppModule {}
