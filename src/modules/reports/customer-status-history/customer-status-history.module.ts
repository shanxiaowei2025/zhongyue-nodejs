import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerStatusHistory } from './entities/customer-status-history.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { CustomerStatusHistoryController } from './customer-status-history.controller';
import { CustomerStatusHistoryService } from './customer-status-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerStatusHistory, Customer]),
  ],
  controllers: [CustomerStatusHistoryController],
  providers: [CustomerStatusHistoryService],
  exports: [CustomerStatusHistoryService],
})
export class CustomerStatusHistoryModule {} 