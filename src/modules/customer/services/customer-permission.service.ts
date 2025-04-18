import { Injectable, Inject, forwardRef } from '@nestjs/common';
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
  
    // 获取角色对应的权限 - 这里不再过滤permission_value
    const roleNames = roles.map(role => role.name);
    const permissions = await this.permissionRepository.find({
      where: { 
        role_name: In(roleNames)
      },
    });
    
    // 只返回权限值为true的权限名称
    const enabledPermissions = permissions
      .filter(p => p.permission_value === true)
      .map(p => p.permission_name);
    
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
      relations: ['department']
    });
    
    if (!user) {
      return { id: -1 };
    }

    const permissions = await this.getUserPermissions(userId);
    
    // 优先级处理：如果有查看所有权限，直接返回空对象（不添加任何过滤条件）
    if (permissions.includes('customer_date_view_all')) {
      return {}; 
    }

    // 存储所有可能的过滤条件
    const possibleFilters = [];

    // 处理按区域查看权限
    if (permissions.includes('customer_date_view_by_location')) {
      const departmentId = user.dept_id;
      const department = await this.departmentRepository.findOne({
        where: { id: departmentId }
      });
      
      if (department) {
        let locationName: string;
        
        // 如果是部门，需要查询其所属公司
        if (department.type === 3) { // 3 表示部门
          const parent = await this.departmentRepository.findOne({
            where: { id: department.parent?.id }
          });
          if (parent) {
            locationName = parent.name;
          }
        } else if (department.type === 2) { // 2 表示分公司
          locationName = department.name;
        }
        
        if (locationName) {
          possibleFilters.push({ location: locationName });
        }
      }
    }

    // 处理查看自己提交的权限
    if (permissions.includes('customer_date_view_own')) {
      const roles = await this.roleRepository.find({
        where: { code: In(user.roles) }
      });
      
      const roleCodes = roles.map(role => role.code);
      
      // 根据不同角色设置不同的筛选条件
      if (
        roleCodes.includes('sales_specialist') || 
        roleCodes.includes('register_specialist') || 
        roleCodes.includes('admin_specialist')
      ) {
        possibleFilters.push({ submitter: user.username });
      } else if (roleCodes.includes('consultantAccountant')) {
        possibleFilters.push({ consultantAccountant: user.username });
      } else if (roleCodes.includes('bookkeepingAccountant')) {
        possibleFilters.push({ bookkeepingAccountant: user.username });
      } else if (roleCodes.includes('invoiceOfficerName')) {
        possibleFilters.push({ invoiceOfficerName: user.username });
      }
    }

    // 如果没有任何过滤条件，返回无权限
    if (possibleFilters.length === 0) {
      return { id: -1 };
    }
    
    // 返回OR条件
    return possibleFilters.length === 1 
      ? possibleFilters[0] 
      : { $or: possibleFilters };
  }
} 