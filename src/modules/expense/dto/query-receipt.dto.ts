import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryReceiptDto {
  @ApiProperty({
    description: '费用记录ID',
    required: false,
    example: '1',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value;
  })
  id?: string;

  @ApiProperty({
    description: '收据编号',
    required: false,
    example: '20230101001',
  })
  @IsOptional()
  @IsString()
  receiptNo?: string;
}
