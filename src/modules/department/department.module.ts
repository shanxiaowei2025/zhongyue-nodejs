import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { DepartmentController } from './controllers/department.controller';
import { DepartmentService } from './services/department.service';
import { DepartmentInitService } from './services/department-init.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department, User]),
  ],
  controllers: [DepartmentController],
  providers: [
    DepartmentService,
    DepartmentInitService,
  ],
  exports: [DepartmentService],
})
export class DepartmentModule {} 