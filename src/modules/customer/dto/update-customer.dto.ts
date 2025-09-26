// 更新客户时的数据结构
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCustomerDto, FollowUpRecordItemDto } from './create-customer.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiPropertyOptional({
    description: '跟进记录，数组对象格式：[{"datetime": "ISO 8601格式", "text": "跟进记录内容"}]。' +
      '注意：此字段在PATCH更新时会自动追加到现有跟进记录数组中，不会覆盖原有记录。' +
      '智能时间填充：如果只提供text字段而未提供datetime字段，系统会自动填充当前时间。' +
      '如果需要完全替换跟进记录，请使用PUT请求或先清空再添加。',
    type: [FollowUpRecordItemDto],
    example: [
      { datetime: '2025-09-26T16:30:00.000Z', text: '客户已确认合作意向' },
      { text: '已发送合同模板' }, // 自动填充当前时间
      { datetime: '2025-09-26T17:00:00.000Z', text: '明确指定时间的记录' }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FollowUpRecordItemDto)
  @IsOptional()
  followUpRecords?: FollowUpRecordItemDto[];
}
