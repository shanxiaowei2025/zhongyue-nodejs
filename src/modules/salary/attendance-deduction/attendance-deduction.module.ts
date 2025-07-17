import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { AttendanceDeductionService } from './attendance-deduction.service';
import { AttendanceDeductionController } from './attendance-deduction.controller';
import { AttendanceDeduction } from './entities/attendance-deduction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceDeduction]),
    AuthModule
  ],
  controllers: [AttendanceDeductionController],
  providers: [AttendanceDeductionService],
  exports: [AttendanceDeductionService],
})
export class AttendanceDeductionModule {} 