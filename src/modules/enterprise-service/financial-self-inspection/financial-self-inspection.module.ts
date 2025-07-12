import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialSelfInspectionController } from './financial-self-inspection.controller';
import { FinancialSelfInspectionService } from './financial-self-inspection.service';
import { FinancialSelfInspection } from './entities/financial-self-inspection.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialSelfInspection]), AuthModule],
  controllers: [FinancialSelfInspectionController],
  providers: [FinancialSelfInspectionService],
  exports: [FinancialSelfInspectionService],
})
export class FinancialSelfInspectionModule {}
