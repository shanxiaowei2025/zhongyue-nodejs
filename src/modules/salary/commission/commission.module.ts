import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';

import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';

import { 
  AgencyCommission, 
  BusinessSalesCommission, 
  BusinessConsultantCommission, 
  BusinessOtherCommission,
  PerformanceCommission
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgencyCommission,
      BusinessSalesCommission,
      BusinessConsultantCommission,
      BusinessOtherCommission,
      PerformanceCommission
    ]),
    AuthModule
  ],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService]
})
export class CommissionModule {} 