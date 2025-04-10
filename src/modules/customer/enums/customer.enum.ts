// 定义枚举类型
// 例如：
// - 企业状态：active/inactive/pending
// - 业务状态：normal/suspended/terminated
export enum EnterpriseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

export enum TaxRegistrationType {
  GENERAL = 'general',
  SMALL_SCALE = 'small_scale',
  SPECIAL = 'special'
}

export enum BusinessStatus {
  NORMAL = 'normal',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated'
} 