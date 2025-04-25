import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Department } from '../../department/entities/department.entity';
import { Contract } from '../entities/contract.entity';
import { Customer } from '../../customer/entities/customer.entity';

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

    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
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

  // 检查用户是否有合同编辑权限
  async hasContractEditPermission(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const hasPermission = permissions.includes('contract_action_create') &&
      permissions.includes('contract_action_edit') &&
      permissions.includes('contract_action_delete');
    
    return hasPermission;
  }

  // 根据用户权限构建合同查询条件
  async buildContractQueryFilter(userId: number): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department', 'department.parent'],
    });

    if (!user) {
      console.log('未找到用户:', userId);
      return [];
    }

    const permissions = await this.getUserPermissions(userId);
    console.log('用户权限:', permissions);

    // 存储不同权限对应的查询条件
    const conditions: any[] = [];

    // 处理查看所有权限
    if (permissions.includes('contract_data_view_all')) {
      console.log('用户有查看所有权限');
      return [{}];
    }

    // 获取用户角色
    const roles = await this.roleRepository.find({
      where: { code: In(user.roles) },
      select: ['code'],
    });
    const roleCodes = roles.map((role) => role.code);

    // 处理按区域查看权限
    if (permissions.includes('contract_data_view_by_location')) {
      console.log('用户有按区域查看权限');
      
      // 获取用户部门信息
      const department = await this.departmentRepository.findOne({
        where: { id: user.dept_id },
        select: ['id', 'name', 'type'],
        relations: ['parent'],
      });
      
      if (department) {
        console.log('用户部门:', department.name);
        
        // 获取所有客户的位置信息
        const customers = await this.customerRepository.find({
          select: ['companyName', 'location']
        });
        
        // 创建位置匹配部门名称的客户名称列表
        const departmentName = department.type === 2 ? 
          department.name : 
          (department.parent ? department.parent.name : department.name);
        
        console.log('用于匹配的部门名称:', departmentName);
        
        // 筛选出location与部门名称匹配的客户
        const customersByLocation = customers
          .filter(customer => customer.location === departmentName && customer.companyName)
          .map(customer => customer.companyName);
        
        console.log('匹配到的客户数量:', customersByLocation.length);
        
        if (customersByLocation.length > 0) {
          // 使用特殊标记，让service知道这是客户名称列表
          conditions.push({
            _special: 'customerNames',
            customerNames: customersByLocation
          });
        }
      }
    }

    // 处理查看自己提交的权限
    if (permissions.includes('contract_data_view_own')) {
      console.log('用户有查看自己提交的权限');
      conditions.push({
        submitter: user.username,
      });
    }

    // 如果没有任何权限条件，返回空数组
    if (conditions.length === 0) {
      console.log('用户没有任何查看权限');
      return [];
    }

    console.log('最终查询条件:', conditions);
    return conditions;
  }
} 