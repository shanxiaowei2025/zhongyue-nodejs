// 定义枚举类型
// 例如：
// - 企业状态：active/inactive/pending
// - 业务状态有正常、已注销、注销中、已流失、等待转出：normal、logged_out、logging_out、lost、waiting_transfer
// export enum EnterpriseStatus {
//   ACTIVE = 'active',
//   INACTIVE = 'inactive',
//   PENDING = 'pending'
// }

// export enum TaxRegistrationType {
//   GENERAL = 'general',
//   SMALL_SCALE = 'small_scale',
//   SPECIAL = 'special'
// }

// 正常、已注销、注销中、已流失、等待转出
export enum BusinessStatus {
  NORMAL = 'normal', 
  LOGGED_OUT = 'logged_out',
  LOGGING_OUT = 'logging_out',
  LOST = 'lost',
  WAITING_TRANSFER = 'waiting_transfer'
} 