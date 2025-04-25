import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { ContractPermissionService } from './services/contract-permission.service';
import { Contract } from './entities/contract.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';
import { Customer } from '../customer/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      User,
      Role,
      Permission,
      Department,
      Customer
    ])
  ],
  controllers: [ContractController],
  providers: [ContractService, ContractPermissionService],
  exports: [ContractService, ContractPermissionService],
})
export class ContractModule {} 