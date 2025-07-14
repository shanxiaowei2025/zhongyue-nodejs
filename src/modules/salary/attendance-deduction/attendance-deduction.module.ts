import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceDeductionService } from './attendance-deduction.service';
import { AttendanceDeductionController } from './attendance-deduction.controller';
import { AttendanceDeduction } from './entities/attendance-deduction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceDeduction])],
  controllers: [AttendanceDeductionController],
  providers: [AttendanceDeductionService],
  exports: [AttendanceDeductionService],
})
export class AttendanceDeductionModule {} 