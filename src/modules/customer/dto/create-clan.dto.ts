import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ArrayMinSize } from 'class-validator';

export class CreateClanDto {
  @ApiProperty({ description: '宗族名称' })
  @IsString()
  clanName: string;

  @ApiProperty({ 
    description: '成员列表', 
    type: [String], 
    required: false,
    example: ['张三', '李四', '王五']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberList?: string[];

  @ApiProperty({ description: '创建人', required: false })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
} 