import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Department } from '../../department/entities/department.entity';
import { Expense } from '../entities/expense.entity';
import { hasSubscribers } from 'diagnostics_channel';

@Injectable()
export class ExpensePermissionService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,

    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  // 获取用户的所有权限名称
  async getUserPermissions(userId: number): Promise<string[]> {
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.roles || user.roles.length === 0) {
      return [];
    }

    const roles = await this.roleRepository.find({
      where: { code: In(user.roles) },
    });
    if (!roles || roles.length === 0) {
      return [];
    }

    const roleNames = roles.map((role) => role.name);
    const permissions = await this.permissionRepository.find({
      where: {
        role_name: In(roleNames),
      },
    });

    const enabledPermissions = permissions
      .filter((p) => p.permission_value === true)
      .map((p) => p.permission_name);
    
    return enabledPermissions;
  }

  // 检查用户是否有费用编辑权限
  async hasExpenseEditPermission(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const hasPermission = permissions.includes('expense_action_create') &&
      permissions.includes('expense_action_edit');

    return hasPermission;
  }
    // 检查用户是否有费用删除权限
    async hasExpenseDeletePermission(userId: number): Promise<boolean> {
      const permissions = await this.getUserPermissions(userId);
      const hasPermission = permissions.includes('expense_action_delete');
      
      return hasPermission;
    }

  // 检查用户是否有费用审核权限
  async hasExpenseAuditPermission(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const hasPermission = permissions.includes('expense_action_audit');
    
    return hasPermission;
  }

  // 根据用户权限构建费用查询条件
  async buildExpenseQueryFilter(userId: number): Promise<any> {
    
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department', 'department.parent'],
    });

    if (!user) {
      return { id: -1 };
    }

    const permissions = await this.getUserPermissions(userId);

    // 存储不同权限对应的查询条件
    const conditions: any[] = [];

    // 处理查看所有权限
    if (permissions.includes('expense_data_view_all')) {
      conditions.push({});
      return conditions;
    }

    // 获取用户角色
    const roles = await this.roleRepository.find({
      where: { code: In(user.roles) },
      select: ['code'],
    });
    const roleCodes = roles.map((role) => role.code);

    // 处理按区域查看权限
    if (permissions.includes('expense_data_view_by_location')) {
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
        relations: ['parent'],
      });

      if (department.type === 2) {
        conditions.push({
          companyLocation: department.name,
        });
      } else if (department?.parent) {
        conditions.push({
          companyLocation: department.parent.name,
        });
      }
    }

    // 处理查看自己提交的权限
    if (permissions.includes('expense_data_view_own')) {
      conditions.push({
        submitter: user.username,
      });
    }

    // 如果没有任何权限条件，返回无权限
    if (conditions.length === 0) {
      return { id: -1 };
    }

    // 如果只有一个条件，直接返回
    if (conditions.length === 1) {
      return conditions[0];
    }

    // 如果有多个条件，返回条件数组
    return conditions;
  }

  // 检查用户是否有查看收据权限
  async hasExpenseViewReceiptPermission(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const hasPermission = permissions.includes('expense_action_view_receipt');
    
    return hasPermission;
  }
} 