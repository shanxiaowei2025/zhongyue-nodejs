import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SalaryAuthDto {
  @ApiProperty({
    description: '薪资查看密码',
    example: 'salary123',
    minLength: 6,
  })
  @IsString({ message: '薪资密码必须是字符串' })
  @IsNotEmpty({ message: '薪资密码不能为空' })
  @MinLength(6, { message: '薪资密码至少6位' })
  salaryPassword: string;
}

export class SetSalaryPasswordDto {
  @ApiProperty({
    description: '新的薪资查看密码',
    example: 'newSalary123',
    minLength: 6,
  })
  @IsString({ message: '薪资密码必须是字符串' })
  @IsNotEmpty({ message: '薪资密码不能为空' })
  @MinLength(6, { message: '薪资密码至少6位' })
  salaryPassword: string;
}

export class ChangeSalaryPasswordDto {
  @ApiProperty({
    description: '当前薪资密码',
    example: 'oldSalary123',
  })
  @IsString({ message: '当前薪资密码必须是字符串' })
  @IsNotEmpty({ message: '当前薪资密码不能为空' })
  currentSalaryPassword: string;

  @ApiProperty({
    description: '新的薪资密码',
    example: 'newSalary123',
    minLength: 6,
  })
  @IsString({ message: '新薪资密码必须是字符串' })
  @IsNotEmpty({ message: '新薪资密码不能为空' })
  @MinLength(6, { message: '新薪资密码至少6位' })
  newSalaryPassword: string;
}
