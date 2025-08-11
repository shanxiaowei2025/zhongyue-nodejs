import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Department } from '../../department/entities/department.entity';
import { Contract } from '../entities/contract.entity';

@Injectable()
export class ContractPermissionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,

    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
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

  // 构建合同查询权限过滤条件
  async buildContractQueryFilter(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department', 'department.parent'],
    });

    if (!user) {
      console.log('用户未找到:', userId);
      return { id: -999 }; // 返回一个不可能满足的查询条件
    }

    console.log('用户信息:', {
      username: user.username,
      roles: user.roles,
      department: user.department?.name,
      parentDepartment: user.department?.parent?.name,
    });

    const permissions = await this.getUserPermissions(userId);
    console.log('用户权限:', permissions);

    // 检查用户是否有任何合同查看权限
    const hasAnyContractViewPermission = permissions.some(
      (p) =>
        p === 'contract_data_view_all' ||
        p === 'contract_data_view_own' ||
        p === 'contract_data_view_by_location',
    );

    // 如果用户没有任何合同查看权限，返回一个不可能满足的查询条件
    if (!hasAnyContractViewPermission) {
      console.log('用户没有任何合同查看权限');
      return { id: -999 }; // 返回一个不可能存在的ID
    }

    // 存储不同权限对应的查询条件
    const conditions: any[] = [];

    // 处理查看所有权限
    if (permissions.includes('contract_data_view_all')) {
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
    if (permissions.includes('contract_data_view_by_location')) {
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
    if (permissions.includes('contract_data_view_own')) {
      conditions.push({
        submitter: user.username,
      });
    }

    // 如果没有任何权限条件，返回不可能满足的查询条件
    if (conditions.length === 0) {
      return { id: -999 }; // 返回一个不可能存在的ID
    }

    console.log('查询条件:', conditions);

    // 如果只有一个条件，直接返回
    if (conditions.length === 1) {
      return conditions[0];
    }

    // 如果有多个条件，返回条件数组
    return conditions;
  }

  // 检查用户是否有权限创建合同
  async canCreate(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes('contract_action_create');
  }

  // 检查用户是否有权限查看某个合同
  async canView(contractId: number, userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // 如果有查看所有权限，直接返回true
    if (permissions.includes('contract_data_view_all')) {
      return true;
    }

    // 获取合同信息
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      return false;
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department', 'department.parent'],
    });

    if (!user) {
      return false;
    }

    // 如果是合同的提交者，并且有查看自己权限，则可以查看
    if (
      permissions.includes('contract_data_view_own') &&
      contract.submitter === user.username
    ) {
      return true;
    }

    // 处理按区域查看权限
    if (permissions.includes('contract_data_view_by_location')) {
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
        relations: ['parent'],
      });

      // 如果合同有区域信息，检查是否匹配
      if (contract.location) {
        if (department.type === 2 && contract.location === department.name) {
          return true;
        } else if (department?.parent && contract.location === department.parent.name) {
          return true;
        }
      }

      return false;
    }

    return false;
  }

  // 检查用户是否有权限更新某个合同
  async canUpdate(contractId: number, userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // 检查是否有编辑权限
    if (!permissions.includes('contract_action_edit')) {
      return false;
    }

    // 如果有查看所有权限，则可以编辑所有合同
    if (permissions.includes('contract_data_view_all')) {
      return true;
    }

    // 获取合同信息
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      return false;
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department', 'department.parent'],
    });

    if (!user) {
      return false;
    }

    // 如果是合同的提交者，并且有查看自己权限，则可以编辑
    if (
      permissions.includes('contract_data_view_own') &&
      contract.submitter === user.username
    ) {
      return true;
    }

    // 处理按区域查看权限
    if (permissions.includes('contract_data_view_by_location')) {
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
        relations: ['parent'],
      });

      // 如果合同有区域信息，检查是否匹配
      if (contract.location) {
        if (department.type === 2 && contract.location === department.name) {
          return true;
        } else if (department?.parent && contract.location === department.parent.name) {
          return true;
        }
      }

      return false;
    }

    return false;
  }

  // 检查用户是否有权限删除某个合同
  async canDelete(contractId: number, userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // 检查是否有删除权限
    if (!permissions.includes('contract_action_delete')) {
      return false;
    }

    // 如果有查看所有权限，则可以删除所有合同
    if (permissions.includes('contract_data_view_all')) {
      return true;
    }

    // 获取合同信息
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      return false;
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department', 'department.parent'],
    });

    if (!user) {
      return false;
    }

    // 如果是合同的提交者，并且有查看自己权限，则可以删除
    if (
      permissions.includes('contract_data_view_own') &&
      contract.submitter === user.username
    ) {
      return true;
    }

    // 处理按区域查看权限
    if (permissions.includes('contract_data_view_by_location')) {
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
        relations: ['parent'],
      });

      // 如果合同有区域信息，检查是否匹配
      if (contract.location) {
        if (department.type === 2 && contract.location === department.name) {
          return true;
        } else if (department?.parent && contract.location === department.parent.name) {
          return true;
        }
      }

      return false;
    }

    return false;
  }
}
