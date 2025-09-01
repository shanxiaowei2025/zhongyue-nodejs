import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerLevelHistoryController } from './customer-level-history.controller';
import { CustomerLevelHistoryService } from './customer-level-history.service';
import { CustomerLevelHistory } from './entities/customer-level-history.entity';
import { Customer } from '../../customer/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerLevelHistory, Customer]),
  ],
  controllers: [CustomerLevelHistoryController],
  providers: [CustomerLevelHistoryService],
  exports: [CustomerLevelHistoryService],
})
export class CustomerLevelHistoryModule {} 