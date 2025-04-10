// 用户模块的入口文件
// 负责组织和配置用户模块的所有组件
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';  // 数据库连接工具
import { User } from './entities/user.entity';     // 用户数据结构
import { UsersService } from './users.service';    // 用户相关的业务逻辑
import { UserInitService } from './services/user-init.service';  // 用户初始化服务

@Module({
  imports: [TypeOrmModule.forFeature([User])], // 告诉系统使用User表
  providers: [UsersService, UserInitService],   // 提供用户相关的服务
  exports: [UsersService],                      // 允许其他模块使用用户服务
})
export class UsersModule {}
