import { CreateRoleDto } from '../dto/role.dto';

// 初始角色数据
export const initialRoles: CreateRoleDto[] = [
  {
    name: '超级管理员',
    code: 'super_admin',
    status: 1,
    remark: '系统超级管理员，拥有所有权限'
    // permissions: []
  },
  {
    name: '管理员',
    code: 'admin',
    status: 1,
    remark: '系统管理员，拥有大部分权限'
    // permissions: []
  },
  {
    name: '销售专员',
    code: 'sales_specialist',
    status: 1,
    remark: '销售专员，只负责自己提交的'
    // permissions: []
  },
  {
    name: '注册专员',
    code: 'register_specialist',
    status: 1,
    remark: '注册专员，只负责自己提交的'
    // permissions: []
  },
  {
    name: '行政专员',
    code: 'admin_specialist',
    status: 1,
    remark: '行政专员，只负责自己提交的'
    // permissions: []
  },
  {
    name: '顾问会计',
    code: 'consultantAccountant',
    status: 1,
    remark: '顾问会计，只操作或查看自己负责的'
    // permissions: []
  },
  {
    name: '记账会计',
    code: 'bookkeepingAccountant',
    status: 1,
    remark: '记账会计，只操作或查看自己负责的'
    // permissions: []
  },
  {
    name: '开票员',
    code: 'invoiceOfficerName',
    status: 1,
    remark: '开票员，只操作或查看自己负责的'
    // permissions: []
  },
  {
    name: '分公司负责人',
    code: 'branch_manager',
    status: 1,
    remark: '分公司负责人，只负责自己本区域的'
    // permissions: []
  }
]; 
