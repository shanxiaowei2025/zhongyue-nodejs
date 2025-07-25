import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Salary } from './entities/salary.entity';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';
import { SalaryPermissionService } from './services/salary-permission.service';
import { SalaryAutoUpdateService } from './services/salary-auto-update.service';
// 暂时注释考勤补贴模块导入，后续再实现
// import { AttendanceSubsidyModule } from './attendance-subsidy/attendance-subsidy.module';
import { SubsidySummaryModule } from './subsidy-summary/subsidy-summary.module';
import { FriendCirclePaymentModule } from './friend-circle-payment/friend-circle-payment.module';
import { SocialInsuranceModule } from './social-insurance/social-insurance.module';
import { AttendanceDeductionModule } from './attendance-deduction/attendance-deduction.module';
import { SalaryBaseHistoryModule } from './salary-base-history/salary-base-history.module';
import { CommissionModule } from './commission/commission.module';
import { SalaryBaseHistory } from './salary-base-history/entities/salary-base-history.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';

// 提成表实体
import { 
  AgencyCommission, 
  BusinessSalesCommission, 
  BusinessConsultantCommission, 
  BusinessOtherCommission 
} from './commission/entities';

@Module({
  imports: [
    // 引入定时任务模块
    ScheduleModule.forRoot(),
    // 先注册子模块，确保更具体的路由先注册
    SubsidySummaryModule,
    FriendCirclePaymentModule,
    SocialInsuranceModule,
    AttendanceDeductionModule,
    SalaryBaseHistoryModule,
    CommissionModule,
    // 再注册父模块
    TypeOrmModule.forFeature([
      Salary, 
      SalaryBaseHistory,
      AgencyCommission,
      BusinessSalesCommission,
      BusinessConsultantCommission,
      BusinessOtherCommission,
      // 权限相关实体
      User,
      Role,
      Permission,
      Department,
    ]),
    // 暂时注释考勤补贴模块，后续再实现
    // AttendanceSubsidyModule,
  ],
  controllers: [SalaryController],
  providers: [SalaryService, SalaryPermissionService, SalaryAutoUpdateService],
  exports: [SalaryService],
})
export class SalaryModule {}
