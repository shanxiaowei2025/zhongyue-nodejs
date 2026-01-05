import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessStatisticsController } from './business-statistics.controller';
import { BusinessStatisticsService } from './business-statistics.service';
import { Expense } from '../expense/entities/expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  controllers: [BusinessStatisticsController],
  providers: [BusinessStatisticsService],
  exports: [BusinessStatisticsService],
})
export class BusinessStatisticsModule {}
