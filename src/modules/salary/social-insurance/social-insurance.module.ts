import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { SocialInsuranceService } from './social-insurance.service';
import { SocialInsuranceController } from './social-insurance.controller';
import { SocialInsurance } from './entities/social-insurance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialInsurance]),
    AuthModule
  ],
  controllers: [SocialInsuranceController],
  providers: [SocialInsuranceService],
  exports: [SocialInsuranceService],
})
export class SocialInsuranceModule {} 