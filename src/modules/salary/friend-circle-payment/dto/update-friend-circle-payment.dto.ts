import { PartialType } from '@nestjs/swagger';
import { CreateFriendCirclePaymentDto } from './create-friend-circle-payment.dto';

export class UpdateFriendCirclePaymentDto extends PartialType(CreateFriendCirclePaymentDto) {} 