// 初始权限定义（不包含角色关联，只是权限的定义）
export const initialPermissions = [
  // 客户管理权限
  {
    page_name: '客户管理',
    permission_name: 'customer_action_create',
    description: '客户管理-创建'
  },
  {
    page_name: '客户管理',
    permission_name: 'customer_action_edit',
    description: '客户管理-编辑'
  },
  {
    page_name: '客户管理',
    permission_name: 'customer_action_delete',
    description: '客户管理-删除'
  },
  {
    page_name: '客户管理',
    permission_name: 'customer_date_view_all',
    description: '客户管理-查看所有'
  },
  {
    page_name: '客户管理',
    permission_name: 'customer_date_view_by_location',
    description: '客户管理-查看本地'
  },
  {
    page_name: '客户管理',
    permission_name: 'customer_date_view_own',
    description: '客户管理-查看自己提交'
  }
]; 