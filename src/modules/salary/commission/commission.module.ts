import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';
import {
  BusinessSalesCommission,
  BusinessConsultantCommission,
  BusinessOtherCommission,
  PerformanceCommission,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessSalesCommission,
      BusinessConsultantCommission,
      BusinessOtherCommission,
      PerformanceCommission,
    ]),
  ],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {} 