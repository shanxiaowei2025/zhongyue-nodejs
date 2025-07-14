import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxVerificationController } from './tax-verification.controller';
import { TaxVerificationService } from './tax-verification.service';
import { TaxVerification } from './entities/tax-verification.entity';
import { Customer } from '../../customer/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaxVerification, Customer])],
  controllers: [TaxVerificationController],
  providers: [TaxVerificationService],
  exports: [TaxVerificationService],
})
export class TaxVerificationModule {} 