import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendCirclePaymentService } from './friend-circle-payment.service';
import { FriendCirclePaymentController } from './friend-circle-payment.controller';
import { FriendCirclePayment } from './entities/friend-circle-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FriendCirclePayment])],
  controllers: [FriendCirclePaymentController],
  providers: [FriendCirclePaymentService],
  exports: [FriendCirclePaymentService],
})
export class FriendCirclePaymentModule {} 