import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionController } from './controllers/permission.controller';
import { PermissionService } from './services/permission.service';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { RolesModule } from '../roles/roles.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Role, User]),
    RolesModule,
  ],
  controllers: [PermissionController],
  providers: [
    PermissionService,
  ],
  exports: [PermissionService],
})
export class PermissionsModule {} 