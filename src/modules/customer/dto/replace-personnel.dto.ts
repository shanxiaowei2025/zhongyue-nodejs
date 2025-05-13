import { ApiProperty } from '../../../common/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

// 定义支持替换的人员类型枚举
export enum PersonnelType {
  CONSULTANT_ACCOUNTANT = 'consultantAccountant', // 顾问会计
  BOOKKEEPING_ACCOUNTANT = 'bookkeepingAccountant', // 记账会计
  INVOICE_OFFICER = 'invoiceOfficer', // 开票员
  TAX_OFFICER_NAME = 'taxOfficerName', // 办税员
  LEGAL_REPRESENTATIVE_NAME = 'legalRepresentativeName', // 法人姓名
  FINANCIAL_CONTACT_NAME = 'financialContactName', // 财务负责人
  INVOICE_OFFICER_NAME = 'invoiceOfficerName', // 开票员姓名
  SUBMITTER = 'submitter', // 提交人
}

// 批量替换人员的请求DTO
export class ReplacePersonnelDto {
  @ApiProperty({ description: '人员类型(职位)', enum: PersonnelType, example: PersonnelType.CONSULTANT_ACCOUNTANT })
  @IsNotEmpty({ message: '人员类型不能为空' })
  @IsEnum(PersonnelType, { message: '无效的人员类型' })
  personnelType: PersonnelType;

  @ApiProperty({ description: '原人员姓名', example: '张三' })
  @IsNotEmpty({ message: '原人员姓名不能为空' })
  @IsString({ message: '原人员姓名必须是字符串' })
  originalName: string;

  @ApiProperty({ description: '替换为的人员姓名', example: '李四' })
  @IsNotEmpty({ message: '替换人员姓名不能为空' })
  @IsString({ message: '替换人员姓名必须是字符串' })
  replacementName: string;
} 