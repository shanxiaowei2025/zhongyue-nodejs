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
import { Clan } from './entities/clan.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';
import { CustomerPermissionService } from './services/customer-permission.service';
import { ClanService } from './services/clan.service';
import { ClanController } from './clan.controller';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { memoryStorage } from 'multer';
import { PermissionsModule } from '../permissions/permissions.module';
import { StorageModule } from '../storage/storage.module';
import { ServiceHistoryModule } from '../enterprise-service/service-history/service-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Clan, User, Role, Permission, Department]),
    MulterModule.register({
      storage: memoryStorage(), // 使用内存存储而不是磁盘存储，确保file.buffer可用
    }),
    PermissionsModule,
    StorageModule,
    ServiceHistoryModule,
  ],
  controllers: [CustomerController, ClanController],
  providers: [CustomerService, ClanService, CustomerPermissionService],
  exports: [CustomerService, ClanService],
})
export class CustomerModule {
  constructor() {
    // 确保上传目录存在
    const uploadPath = join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
  }
}
