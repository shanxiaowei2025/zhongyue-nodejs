import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';

// export class CreatePermissionDto {
//   @ApiProperty({ description: '角色ID' })
//   @IsNumber()
//   role_id: number;

//   @ApiProperty({ description: '页面名称', example: '合同管理' })
//   @IsString()
//   page_name: string;

//   @ApiProperty({ description: '权限名称', example: 'contract_view' })
//   @IsString()
//   permission_name: string;

//   @ApiProperty({ description: '权限值', example: true })
//   @IsBoolean()
//   permission_value: boolean;

//   @ApiProperty({ description: '权限描述', example: '查看合同列表' })
//   @IsString()
//   description: string;
// }

export class UpdatePermissionDto {
  @ApiProperty({ description: '权限值', example: true })
  @IsBoolean()
  permission_value: boolean;
}

// export class BatchCreatePermissionDto {
//     @ApiProperty({
//       description: '权限记录列表',
//       type: [CreatePermissionDto]
//     })
//     @IsArray()
//     @ValidateNested({ each: true })
//     @Type(() => CreatePermissionDto)
//     permissions: CreatePermissionDto[];
//   }

export class GetPermissionsQueryDto {
  @ApiProperty({ description: '角色ID', required: false })
  @IsNumber()
  @IsOptional()
  role_id?: number;

  @ApiProperty({ description: '页面名称', required: false })
  @IsString()
  @IsOptional()
  page_name?: string;
}

export class GetPermissionByNameDto {
  @ApiProperty({ description: '角色名称', example: '管理员' })
  @IsString()
  role_name: string;

  @ApiProperty({ description: '权限名称', example: 'customer_action_create' })
  @IsString()
  permission_name: string;
}
