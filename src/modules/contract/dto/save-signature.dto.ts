import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveSignatureDto {
  @ApiProperty({ description: '合同ID' })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty({ message: '合同ID不能为空' })
  contractId: number;

  @ApiProperty({ description: '令牌' })
  @IsString()
  @IsNotEmpty({ message: '令牌不能为空' })
  token: string;

  @ApiProperty({ description: '签名图片链接' })
  @IsString()
  @IsNotEmpty({ message: '签名图片链接不能为空' })
  signatureUrl: string;
} 