import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseServiceController } from './enterprise-service.controller';
import { EnterpriseServiceService } from './enterprise-service.service';
import { ServiceHistoryModule } from './service-history/service-history.module';
import { ExpenseContributionModule } from './expense-contribution/expense-contribution.module';
import { FinancialSelfInspectionModule } from './financial-self-inspection/financial-self-inspection.module';
import { TaxVerificationModule } from './tax-verification/tax-verification.module';
import { ChangeHistoryModule } from './change-history/change-history.module';
import { Customer } from '../customer/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    ServiceHistoryModule,
    ExpenseContributionModule,
    FinancialSelfInspectionModule,
    TaxVerificationModule,
    ChangeHistoryModule,
  ],
  controllers: [EnterpriseServiceController],
  providers: [EnterpriseServiceService],
  exports: [EnterpriseServiceService],
})
export class EnterpriseServiceModule {} 