import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { Expense } from './entities/expense.entity';
import { ExpensePermissionService } from './services/expense-permission.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';
import { Customer } from '../customer/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      User,
      Role,
      Permission,
      Department,
      Customer
    ]),
  ],
  controllers: [ExpenseController],
  providers: [
    ExpenseService,
    ExpensePermissionService,
  ],
  exports: [ExpenseService, ExpensePermissionService],
})
export class ExpenseModule {} 