// 这是模块的入口文件，负责组织和配置该模块的所有组件
// 主要功能：
// 1. 导入需要的依赖模块（如 TypeOrmModule）
// 2. 声明该模块的控制器（Controller）
// 3. 声明该模块的服务（Service）
// 4. 导出可能被其他模块使用的服务
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { Customer } from './entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';
import { CustomerPermissionService } from './services/customer-permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, User, Role, Permission, Department]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerPermissionService],
  exports: [CustomerService],
})
export class CustomerModule {} 