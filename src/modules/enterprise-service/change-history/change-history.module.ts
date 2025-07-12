import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeHistoryController } from './change-history.controller';
import { ChangeHistoryService } from './change-history.service';
import { ChangeHistory } from './entities/change-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeHistory])],
  controllers: [ChangeHistoryController],
  providers: [ChangeHistoryService],
  exports: [ChangeHistoryService],
})
export class ChangeHistoryModule {}
