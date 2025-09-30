-- 为 sys_expense 表添加客户资料整理相关字段
-- 迁移脚本：2025-09-30-add-customer-data-organization-fields.sql

-- 添加客户资料整理费字段
ALTER TABLE `sys_expense` 
ADD COLUMN `customerDataOrganizationFee` DECIMAL(10,2) NULL COMMENT '客户资料整理费' 
AFTER `statisticalEndDate`;

-- 添加整理费开始日期字段
ALTER TABLE `sys_expense` 
ADD COLUMN `organizationStartDate` DATE NULL COMMENT '整理费开始日期' 
AFTER `customerDataOrganizationFee`;

-- 添加整理费结束日期字段
ALTER TABLE `sys_expense` 
ADD COLUMN `organizationEndDate` DATE NULL COMMENT '整理费结束日期' 
AFTER `organizationStartDate`;

-- 验证字段添加成功
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'sys_expense' 
  AND COLUMN_NAME IN ('customerDataOrganizationFee', 'organizationStartDate', 'organizationEndDate')
ORDER BY ORDINAL_POSITION;

-- 显示表结构（可选，用于确认字段位置）
-- DESCRIBE sys_expense; 