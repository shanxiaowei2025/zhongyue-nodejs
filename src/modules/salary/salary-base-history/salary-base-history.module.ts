import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryBaseHistory } from './entities/salary-base-history.entity';
import { SalaryBaseHistoryService } from './salary-base-history.service';
import { SalaryBaseHistoryController } from './salary-base-history.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryBaseHistory]), AuthModule],
  controllers: [SalaryBaseHistoryController],
  providers: [SalaryBaseHistoryService],
  exports: [SalaryBaseHistoryService],
})
export class SalaryBaseHistoryModule {}
