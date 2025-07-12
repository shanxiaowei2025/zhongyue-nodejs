import { PartialType } from '@nestjs/swagger';
import { CreateExpenseDto } from './create-expense.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @ApiProperty({ description: '审核员', required: false })
  @IsOptional()
  @IsString()
  auditor?: string;

  @ApiProperty({ description: '审核日期', required: false })
  @IsOptional()
  @IsString()
  auditDate?: string;

  @ApiProperty({
    description: '状态：0-未审核，1-已审核，2-已拒绝',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '审核拒绝原因', required: false })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
