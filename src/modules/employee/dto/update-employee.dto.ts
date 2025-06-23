import { ApiExtraModels, OmitType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsNotEmpty, ValidateIf } from 'class-validator';

/**
 * 更新员工DTO
 * 基于CreateEmployeeDto，排除idCardNumber字段使其不可修改
 */
@ApiExtraModels(CreateEmployeeDto)
export class UpdateEmployeeDto extends OmitType(CreateEmployeeDto, ['idCardNumber'] as const) {
  /**
   * 禁止传入身份证号字段
   * 通过验证器确保如果传入此字段则验证失败
   */
  @ValidateIf(o => 'idCardNumber' in o)
  @IsNotEmpty({ message: '身份证号码不可以修改' })
  idCardNumber?: never; // 使用never类型确保TypeScript层面的类型安全
} 