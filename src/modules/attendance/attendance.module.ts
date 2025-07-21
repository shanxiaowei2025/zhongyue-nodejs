import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceScheduleService } from './attendance-schedule.service';
import { AttendanceController } from './attendance.controller';
import { Attendance } from './entities/attendance.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    ConfigModule,
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceScheduleService,
  ],
  exports: [AttendanceService],
})
export class AttendanceModule {} 