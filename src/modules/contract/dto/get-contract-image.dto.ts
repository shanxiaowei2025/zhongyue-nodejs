import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetContractImageDto {
  @ApiProperty({
    description: '合同加密编号',
    example: 'AB12CD34EF56GH78',
  })
  @IsNotEmpty({ message: '合同加密编号不能为空' })
  @IsString()
  encryptedCode: string;
}
