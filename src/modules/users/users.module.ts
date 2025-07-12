// 用户模块的入口文件
// 负责组织和配置用户模块的所有组件
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 数据库连接工具
import { User } from './entities/user.entity'; // 用户数据结构
import { UsersService } from './users.service'; // 用户相关的业务逻辑
import { UsersController } from './users.controller';
import { Department } from '../department/entities/department.entity';
import { DepartmentController } from '../department/controllers/department.controller';
import { DepartmentService } from '../department/services/department.service';
import { RolesModule } from '../roles/roles.module'; // 导入角色模块
import { PermissionsModule } from '../permissions/permissions.module'; // 导入权限模块

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Department]),
    RolesModule, // 导入角色模块，使用其服务
    PermissionsModule, // 导入权限模块，使用其服务
  ],
  controllers: [UsersController, DepartmentController],
  providers: [UsersService, DepartmentService],
  exports: [UsersService, DepartmentService], // 允许其他模块使用用户服务
})
export class UsersModule {}
