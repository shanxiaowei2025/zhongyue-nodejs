import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { Deposit } from './entities/deposit.entity';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deposit]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [DepositController],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
