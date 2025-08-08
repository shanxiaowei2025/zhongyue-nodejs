// 主模块文件
// 导入我们需要的工具和模块
import { Module } from '@nestjs/common'; // 这是用来声明模块的装饰器
import { ConfigModule, ConfigService } from '@nestjs/config'; // 这是用来管理配置的模块
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule'; // 导入定时任务模块
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
import { ContractModule } from './modules/contract/contract.module'; // 新增合同管理模块
import { CombinedAuthGuard } from './modules/auth/guards/combined-auth.guard';
import { EnterpriseServiceModule } from './modules/enterprise-service/enterprise-service.module'; // 新增企业服务模块
import { EmployeeModule } from './modules/employee/employee.module'; // 新增员工模块
import { SalaryModule } from './modules/salary/salary.module'; // 新增薪资模块
import { SocialInsuranceModule } from './modules/salary/social-insurance/social-insurance.module'; // 直接导入社保信息模块
import { SubsidySummaryModule } from './modules/salary/subsidy-summary/subsidy-summary.module'; // 直接导入补贴合计模块
import { FriendCirclePaymentModule } from './modules/salary/friend-circle-payment/friend-circle-payment.module'; // 直接导入朋友圈扣款模块
import { AttendanceDeductionModule } from './modules/salary/attendance-deduction/attendance-deduction.module'; // 直接导入考勤扣款模块
import { AttendanceModule } from './modules/attendance/attendance.module'; // 新增考勤模块
import { Deposit } from './modules/salary/deposit/entities/deposit.entity'; // 新增保证金表实体

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
import { Contract } from './modules/contract/entities/contract.entity'; // 新增合同实体
import { Token } from './modules/contract/entities/token.entity'; // 合同令牌实体
import { ServiceHistory } from './modules/enterprise-service/service-history/entities/service-history.entity'; // 服务历程实体
import { ChangeHistory } from './modules/enterprise-service/change-history/entities/change-history.entity'; // 变更历史实体
import { FinancialSelfInspection } from './modules/enterprise-service/financial-self-inspection/entities/financial-self-inspection.entity'; // 财务自检实体
import { TaxVerification } from './modules/enterprise-service/tax-verification/entities/tax-verification.entity'; // 税务核验实体
import { Employee } from './modules/employee/entities/employee.entity'; // 新增员工实体
import { Salary } from './modules/salary/entities/salary.entity'; // 新增薪资实体
import { SubsidySummary } from './modules/salary/subsidy-summary/entities/subsidy-summary.entity'; // 新增补贴合计表实体
import { FriendCirclePayment } from './modules/salary/friend-circle-payment/entities/friend-circle-payment.entity'; // 新增朋友圈扣款表实体
import { SocialInsurance } from './modules/salary/social-insurance/entities/social-insurance.entity'; // 新增社保信息表实体
import { AttendanceDeduction } from './modules/salary/attendance-deduction/entities/attendance-deduction.entity'; // 新增考勤扣款表实体
import { Attendance } from './modules/attendance/entities/attendance.entity'; // 新增考勤实体
import { SalaryBaseHistory } from './modules/salary/salary-base-history/entities/salary-base-history.entity'; // 新增工资基数历程表实体
import {
  BusinessSalesCommission,
  BusinessConsultantCommission,
  BusinessOtherCommission,
  PerformanceCommission,
} from './modules/salary/commission/entities'; // 新增提成表实体

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

        // 企业微信API配置
        CORPID: Joi.string().required(), // 企业微信企业ID
        CORPSECRETA: Joi.string().required(), // 企业微信应用密钥A
        CORPSECRETB: Joi.string().required(), // 企业微信应用密钥B

        // 其他配置
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug') // 日志级别
          .default('info'), // 默认info级别
        CORS_ORIGIN: Joi.string().default('*'), // 允许访问的域名，默认允许所有
      }),
    }),
    ScheduleModule.forRoot(), // 注册定时任务模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'zhongyue'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'zhongyue_nodejs'),
        entities: [
          User,
          Customer,
          Role,
          Permission,
          Department,
          Expense,
          Contract,
          Token,
          ServiceHistory,
          ChangeHistory,
          FinancialSelfInspection,
          TaxVerification,
          Employee, // 新增员工实体
          Salary, // 新增薪资实体
          SubsidySummary, // 新增补贴合计表实体
          FriendCirclePayment, // 新增朋友圈扣款表实体
          SocialInsurance, // 新增社保信息表实体
          AttendanceDeduction, // 新增考勤扣款表实体
          Attendance, // 新增考勤实体
          SalaryBaseHistory, // 新增工资基数历程表实体
          Deposit, // 新增保证金表实体
          BusinessSalesCommission, // 新增业务提成表销售实体
          BusinessConsultantCommission, // 新增业务提成表顾问实体
          BusinessOtherCommission, // 新增业务提成表其他实体
          PerformanceCommission, // 新增绩效提成表实体
        ],
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
        timezone: 'Z', // 设置时区为 UTC
      }),
    }),
    // 导入各个功能模块
    DatabaseModule, // 数据库模块：负责连接和操作数据库
    DepartmentModule, // 部门模块：处理部门相关的功能
    RolesModule, // 角色模块：处理角色相关的功能
    UsersModule, // 用户模块：处理用户相关的功能
    PermissionsModule, // 权限模块：处理权限相关的功能
    AuthModule, // 认证模块：处理登录、注册、权限
    CustomerModule, // 客户模块：处理客户相关的功能
    StorageModule, // 存储模块：处理文件存储相关的功能
    ExpenseModule, // 费用管理模块：处理费用相关的功能
    ContractModule, // 合同管理模块：处理合同相关的功能
    EnterpriseServiceModule, // 企业服务模块：处理企业服务相关的功能
    EmployeeModule, // 员工模块：处理员工相关的功能
    SalaryModule, // 薪资模块：处理薪资相关的功能
    SocialInsuranceModule, // 社保信息模块：直接导入，避免路由冲突
    SubsidySummaryModule, // 补贴合计模块：直接导入，避免路由冲突
    FriendCirclePaymentModule, // 朋友圈扣款模块：直接导入，避免路由冲突
    AttendanceDeductionModule, // 考勤扣款模块：直接导入，避免路由冲突
    AttendanceModule, // 考勤模块：处理考勤同步相关的功能
  ],
  controllers: [AppController], // 控制器：负责接收请求，像前台接待
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CombinedAuthGuard,
    },
  ], // 服务：负责具体业务逻辑，像后台工作人员
})
export class AppModule {}
