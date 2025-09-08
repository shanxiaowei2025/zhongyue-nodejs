import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CommunicationRecordItem {
  @ApiProperty({ description: '沟通结果' })
  @IsString()
  result: string;

  @ApiProperty({ description: '沟通时间' })
  @IsString()
  communicationTime: string;
}

export class CommunicationRecordDto {
  @ApiProperty({
    description: '沟通记录',
    type: [CommunicationRecordItem],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunicationRecordItem)
  communicationRecords: CommunicationRecordItem[];
}

export class AddCommunicationRecordDto {
  @ApiProperty({ description: '沟通结果' })
  @IsString()
  result: string;
} 