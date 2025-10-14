-- 为sys_expense表添加基础业务业绩和外包业务业绩字段
-- 创建日期: 2025-10-14
-- 说明: 在otherBusinessSpecialFee字段后添加两个新字段

-- 添加基础业务业绩字段
ALTER TABLE `sys_expense` 
ADD COLUMN `basicBusinessPerformance` DECIMAL(10,2) NULL COMMENT '基础业务业绩' AFTER `otherBusinessSpecialFee`;

-- 添加外包业务业绩字段
ALTER TABLE `sys_expense` 
ADD COLUMN `outsourcingBusinessPerformance` DECIMAL(10,2) NULL COMMENT '外包业务业绩' AFTER `basicBusinessPerformance`;

-- 验证字段是否添加成功
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'sys_expense' 
  AND COLUMN_NAME IN ('basicBusinessPerformance', 'outsourcingBusinessPerformance');

-- 查看sys_expense表的字段结构（可选）
-- DESCRIBE `sys_expense`;

