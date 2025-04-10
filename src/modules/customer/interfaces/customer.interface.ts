// 定义TypeScript接口
// 主要功能：
// 1. 定义数据类型
// 2. 确保类型安全
// 3. 提供代码提示
export interface ICustomerImages {
  url: string;
  name: string;
  type: string;
}

export interface ICustomerBankInfo {
  bankName: string;
  accountNumber: string;
  bankNumber: string;
}

export interface ITaxPerson {
  name: string;
  phone: string;
  idNumber: string;
  taxPassword: string;
} 