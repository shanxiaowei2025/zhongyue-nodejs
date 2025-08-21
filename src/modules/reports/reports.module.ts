import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsController } from './reports.controller';
import { ReportsService } from './services/reports.service';
import { ReportsPermissionService } from './services/reports-permission.service';
import { ReportsCacheService } from './services/reports-cache.service';
// import { ReportsExportService } from './services/reports-export.service'; // 临时注释掉导出服务
import { ReportCache } from './entities/report-cache.entity';

// 导入相关实体
import { Customer } from '../customer/entities/customer.entity';
import { Expense } from '../expense/entities/expense.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';

// 导入权限模块
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportCache,
      Customer, 
      Expense,
      User,
      Role,
      Permission,
      Department,
    ]),
    PermissionsModule,
    ScheduleModule.forRoot(), // 定时任务支持
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsPermissionService,
    ReportsCacheService,
    // ReportsExportService, // 临时注释掉导出服务
  ],
  exports: [ReportsService, ReportsPermissionService],
})
export class ReportsModule {} 