import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseContributionController } from './expense-contribution.controller';
import { ExpenseContributionService } from './expense-contribution.service';
import { Expense } from '../../expense/entities/expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  controllers: [ExpenseContributionController],
  providers: [ExpenseContributionService],
  exports: [ExpenseContributionService],
})
export class ExpenseContributionModule {}
