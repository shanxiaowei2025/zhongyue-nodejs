// 客户权限服务
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Department } from '../../department/entities/department.entity';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerPermissionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,

    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  // 获取用户的所有权限名称
  async getUserPermissions(userId: number): Promise<string[]> {
    // 查询用户信息获取角色
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.roles || user.roles.length === 0) {
      return [];
    }

    // 查询用户角色名称
    const roles = await this.roleRepository.find({
      where: { code: In(user.roles) },
    });

    if (!roles || roles.length === 0) {
      return [];
    }

    // 获取角色对应的权限
    const roleNames = roles.map((role) => role.name);
    const permissions = await this.permissionRepository.find({
      where: {
        role_name: In(roleNames),
      },
    });

    // 只返回权限值为true的权限名称
    const enabledPermissions = permissions
      .filter((p) => p.permission_value === true)
      .map((p) => p.permission_name);

    return enabledPermissions;
  }

  // 检查用户是否有增删改权限
  async hasCustomerEditPermission(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return (
      permissions.includes('customer_action_create') &&
      permissions.includes('customer_action_edit') &&
      permissions.includes('customer_action_delete')
    );
  }

  // 根据用户权限构建客户查询条件
  async buildCustomerQueryFilter(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department', 'department.parent'],
    });

    if (!user) {
      console.log('用户未找到:', userId);
      return { id: -1 };
    }

    console.log('用户信息:', {
      username: user.username,
      roles: user.roles,
      department: user.department?.name,
      parentDepartment: user.department?.parent?.name,
    });

    const permissions = await this.getUserPermissions(userId);
    console.log('用户权限:', permissions);

    // 存储不同权限对应的查询条件
    const conditions: any[] = [];

    // 处理查看所有权限
    if (permissions.includes('customer_date_view_all')) {
      conditions.push({}); // 空对象表示无限制条件
      return conditions; // 如果有查看所有权限，直接返回，不需要其他条件
    }

    // 获取用户角色
    const roles = await this.roleRepository.find({
      where: { code: In(user.roles) },
      select: ['code'],
    });
    const roleCodes = roles.map((role) => role.code);

    // 处理按区域查看权限
    if (permissions.includes('customer_date_view_by_location')) {
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
        relations: ['parent'],
      });

      if (department.type === 2) {
        conditions.push({
          location: department.name,
        });
      } else if (department?.parent) {
        conditions.push({
          location: department.parent.name,
        });
      }
    }

    // 处理查看自己提交的权限
    if (permissions.includes('customer_date_view_own')) {
      if (roleCodes.includes('bookkeepingAccountant')) {
        conditions.push({
          bookkeepingAccountant: user.username,
        });
      }
      if (roleCodes.includes('consultantAccountant')) {
        conditions.push({
          consultantAccountant: user.username,
        });
      }
      if (roleCodes.includes('invoiceOfficer')) {
        conditions.push({
          invoiceOfficer: user.username,
        });
      }
    }

    // 添加角色默认的查看条件（始终添加，作为条件合集的一部分）
    if (roleCodes.includes('consultantAccountant')) {
      conditions.push({
        consultantAccountant: user.username,
      });
    }

    if (roleCodes.includes('bookkeepingAccountant')) {
      conditions.push({
        bookkeepingAccountant: user.username,
      });
    }

    if (roleCodes.includes('invoiceOfficer')) {
      conditions.push({
        invoiceOfficer: user.username,
      });
    }

    // 如果没有任何权限条件，返回无权限
    if (conditions.length === 0) {
      return { id: -1 };
    }

    console.log('查询条件:', conditions);

    // 如果只有一个条件，直接返回
    if (conditions.length === 1) {
      return conditions[0];
    }

    // 如果有多个条件，返回条件数组
    return conditions;
  }
}
