import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsController } from './reports.controller';
import { ReportsService } from './services/reports.service';
import { ReportsPermissionService } from './services/reports-permission.service';
// import { ReportsExportService } from './services/reports-export.service'; // 临时注释掉导出服务
// ReportCache entity and ReportsCacheService removed (caching via DB disabled)

// 导入相关实体
import { Customer } from '../customer/entities/customer.entity';
import { Expense } from '../expense/entities/expense.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';
import { CustomerLevelHistory } from './customer-level-history/entities/customer-level-history.entity';
import { CustomerStatusHistory } from './customer-status-history/entities/customer-status-history.entity';

// 导入权限模块
import { PermissionsModule } from '../permissions/permissions.module';
import { CustomerLevelHistoryModule } from './customer-level-history/customer-level-history.module';
import { CustomerStatusHistoryModule } from './customer-status-history/customer-status-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer, 
      Expense,
      User,
      Role,
      Permission,
      Department,
      CustomerLevelHistory,
      CustomerStatusHistory,
    ]),
    PermissionsModule,
    CustomerLevelHistoryModule,
    CustomerStatusHistoryModule,
    ScheduleModule.forRoot(), // 定时任务支持
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsPermissionService,
    // ReportsCacheService removed (caching via DB disabled)
    // ReportsExportService, // 临时注释掉导出服务
  ],
  exports: [ReportsService, ReportsPermissionService],
})
export class ReportsModule {} 