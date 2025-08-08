import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SignContractDto {
  @ApiProperty({ description: '电子签名内容', required: true })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
