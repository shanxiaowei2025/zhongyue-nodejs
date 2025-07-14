import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SalaryPermissionService {
  async checkPermission(req: Request, salaryId?: number): Promise<boolean> {
    // 权限验证逻辑将在后续实现
    // 目前仅返回true表示有权限
    return true;
  }
}
