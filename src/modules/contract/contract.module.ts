/**
 * 合同管理模块
 * 
 * 实现功能：
 * 1. 合同基础CRUD操作
 * 2. 合同签署功能
 * 3. 合同权限管理（创建、编辑、删除、查看所有、按区域查看、查看自己）
 * 4. 合同令牌管理（生成、验证、临时令牌）
 */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { Contract } from './entities/contract.entity';
import { ContractPermissionService } from './services/contract-permission.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Department } from '../department/entities/department.entity';
import { AuthModule } from '../auth/auth.module';
import { Token } from './entities/token.entity';
import { TokenService } from './services/token.service';
import { ContractTokenController } from './contract-token.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      User,
      Role,
      Permission,
      Department,
      Token,
    ]),
    forwardRef(() => AuthModule),
    StorageModule,
  ],
  controllers: [ContractController, ContractTokenController],
  providers: [
    ContractService,
    ContractPermissionService,
    TokenService,
  ],
  exports: [
    ContractService,
    ContractPermissionService,
    TokenService,
  ],
})
export class ContractModule {} 