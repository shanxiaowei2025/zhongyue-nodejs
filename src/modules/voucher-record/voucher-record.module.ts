import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherRecordService } from './voucher-record.service';
import { VoucherRecordController } from './voucher-record.controller';
import { VoucherRecordYear } from './entities/voucher-record-year.entity';
import { VoucherRecordMonth } from './entities/voucher-record-month.entity';
import { VoucherRecordPermissionService } from './services/voucher-record-permission.service';
import { VoucherRecordPermissionGuard } from './guards/voucher-record-permission.guard';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoucherRecordYear, VoucherRecordMonth, Permission, Role]),
  ],
  controllers: [VoucherRecordController],
  providers: [VoucherRecordService, VoucherRecordPermissionService, VoucherRecordPermissionGuard],
  exports: [VoucherRecordService, VoucherRecordPermissionService],
})
export class VoucherRecordModule {} 