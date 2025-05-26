/**
 * 合同管理模块
 * 
 * 实现功能：
 * 1. 合同基础CRUD操作
 * 2. 合同签署功能
 * 3. 合同权限管理（创建、编辑、删除、查看所有、按区域查看、查看自己）
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { Contract } from './entities/contract.entity';
import { ContractPermissionService } from './services/contract-permission.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      User,
      Role,
      Permission,
      Department,
    ]),
  ],
  controllers: [ContractController],
  providers: [
    ContractService,
    ContractPermissionService,
  ],
  exports: [ContractService],
})
export class ContractModule {} 