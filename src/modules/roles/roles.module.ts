import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './controllers/role.controller';
import { RoleService } from './services/role.service';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermissionHooks } from './hooks/role-permission.hooks';
import { RoleInitService } from './services/role-init.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
  ],
  controllers: [RoleController],
  providers: [
    RoleService, 
    RolePermissionHooks,
    RoleInitService,
  ],
  exports: [RoleService],
})
export class RolesModule {} 