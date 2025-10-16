import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConfirmedDto {
  @ApiProperty({
    description: '是否已确认',
    type: 'boolean',
    required: true,
    example: true,
  })
  @IsBoolean()
  isConfirmed: boolean;
}

