import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';
import { SalaryBaseHistoryModule } from '../salary/salary-base-history/salary-base-history.module';
import { PerformanceCommission } from '../salary/commission/entities/performance-commission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, PerformanceCommission]),
    SalaryBaseHistoryModule
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {} 