import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessOptionsController } from './business-options.controller';
import { BusinessOptionsService } from './business-options.service';
import { BusinessOption } from './entities/business-option.entity';

/**
 * 业务选项模块
 * 提供业务选项管理的完整功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessOption]),
  ],
  controllers: [BusinessOptionsController],
  providers: [BusinessOptionsService],
  exports: [BusinessOptionsService],
})
export class BusinessOptionsModule {}

