import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryBaseHistory } from './entities/salary-base-history.entity';
import { SalaryBaseHistoryService } from './salary-base-history.service';
import { SalaryBaseHistoryController } from './salary-base-history.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryBaseHistory])
  ],
  controllers: [SalaryBaseHistoryController],
  providers: [SalaryBaseHistoryService],
  exports: [SalaryBaseHistoryService]
})
export class SalaryBaseHistoryModule {} 