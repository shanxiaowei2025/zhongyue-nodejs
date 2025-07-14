import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceHistoryController } from './service-history.controller';
import { ServiceHistoryService } from './service-history.service';
import { ServiceHistory } from './entities/service-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceHistory])],
  controllers: [ServiceHistoryController],
  providers: [ServiceHistoryService],
  exports: [ServiceHistoryService],
})
export class ServiceHistoryModule {} 