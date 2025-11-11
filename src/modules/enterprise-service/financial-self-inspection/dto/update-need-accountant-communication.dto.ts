import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNeedAccountantCommunicationDto {
  @ApiProperty({
    description: '是否需要会计沟通（true:需要 false:不需要）',
    example: true,
  })
  @IsBoolean()
  needAccountantCommunication: boolean;
}

