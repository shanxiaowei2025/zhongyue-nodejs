import { CreateDepartmentDto } from '../dto/department.dto';

export const initialDepartments: (CreateDepartmentDto & { id?: number })[] = [
  // 总部
  {
    id: 1,
    name: '中岳会计公司',
    parent_id: null,
    sort: 1,
    phone: '12345678',
    principal: '张总',
    email: 'zhangzong@zhongyue.com',
    status: 1,
    type: 1, // 1-公司
    remark: '总部'
  },
  
  // 分公司
  {
    id: 2,
    name: '定兴总公司',
    parent_id: 1,
    sort: 11,
    phone: '12345678',
    principal: '李经理',
    email: 'dingxing@zhongyue.com',
    status: 1,
    type: 2, // 2-分公司
    remark: '定兴总公司'
  },
  {
    id: 3,
    name: '高碑店分公司',
    parent_id: 1,
    sort: 12,
    phone: '12345678',
    principal: '王经理',
    email: 'gaobeidian@zhongyue.com',
    status: 1,
    type: 2, // 2-分公司
    remark: '高碑店分公司'
  },
  {
    id: 4,
    name: '雄安分公司',
    parent_id: 1,
    sort: 13,
    phone: '12345678',
    principal: '王经理',
    email: 'xiongan@zhongyue.com',
    status: 1,
    type: 2, // 2-分公司
    remark: '雄安分公司'
  },
  
  // 定兴总公司下属部门
  {
    id: 5,
    name: '销售部',
    parent_id: 2,
    sort: 1111,
    phone: '12345678',
    principal: '赵经理',
    email: 'sales-dingxing@zhongyue.com',
    status: 1,
    type: 3, // 3-部门
    remark: '定兴总公司销售部'
  },
  {
    id: 6,
    name: '注册部',
    parent_id: 2,
    sort: 1112,
    phone: '12345678',
    principal: '钱经理',
    email: 'register-dingxing@zhongyue.com',
    status: 1,
    type: 3, // 3-部门
    remark: '定兴总公司注册部'
  },
  {
    id: 7,
    name: '行政部',
    parent_id: 2,
    sort: 1113,
    phone: '12345678',
    principal: '孙经理',
    email: 'admin-dingxing@zhongyue.com',
    status: 1,
    type: 3, // 3-部门
    remark: '定兴总公司行政部'
  },
  {
    id: 8,
    name: '账务部',
    parent_id: 2,
    sort: 1114,
    phone: '12345678',
    principal: '李经理',
    email: 'accounting-dingxing@zhongyue.com',
    status: 1,
    type: 3, // 3-部门
    remark: '定兴总公司账务部'
  }
]; 