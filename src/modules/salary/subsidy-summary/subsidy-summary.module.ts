import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubsidySummaryService } from './subsidy-summary.service';
import { SubsidySummaryController } from './subsidy-summary.controller';
import { SubsidySummary } from './entities/subsidy-summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubsidySummary])],
  controllers: [SubsidySummaryController],
  providers: [SubsidySummaryService],
  exports: [SubsidySummaryService],
})
export class SubsidySummaryModule {} 