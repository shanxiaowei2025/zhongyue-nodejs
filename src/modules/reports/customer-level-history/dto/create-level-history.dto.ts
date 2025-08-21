import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateLevelHistoryDto {
  @ApiProperty({ description: '客户ID' })
  @IsNotEmpty({ message: '客户ID不能为空' })
  @IsNumber({}, { message: '客户ID必须是数字' })
  customerId: number;

  @ApiProperty({ description: '企业名称' })
  @IsNotEmpty({ message: '企业名称不能为空' })
  @IsString({ message: '企业名称必须是字符串' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  @IsNotEmpty({ message: '统一社会信用代码不能为空' })
  @IsString({ message: '统一社会信用代码必须是字符串' })
  unifiedSocialCreditCode: string;

  @ApiProperty({ description: '变更前的客户等级', required: false })
  @IsOptional()
  @IsString({ message: '变更前等级必须是字符串' })
  previousLevel?: string;

  @ApiProperty({ description: '变更后的客户等级' })
  @IsNotEmpty({ message: '变更后等级不能为空' })
  @IsString({ message: '变更后等级必须是字符串' })
  currentLevel: string;

  @ApiProperty({ description: '等级变更日期', example: '2025-01-15' })
  @IsNotEmpty({ message: '变更日期不能为空' })
  @IsDateString({}, { message: '变更日期格式不正确' })
  changeDate: string;

  @ApiProperty({ description: '变更原因', required: false })
  @IsOptional()
  @IsString({ message: '变更原因必须是字符串' })
  changeReason?: string;

  @ApiProperty({ description: '操作人员', required: false })
  @IsOptional()
  @IsString({ message: '操作人员必须是字符串' })
  changedBy?: string;

  @ApiProperty({ description: '备注信息', required: false })
  @IsOptional()
  @IsString({ message: '备注信息必须是字符串' })
  remarks?: string;
} 