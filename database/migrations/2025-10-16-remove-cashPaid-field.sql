-- 删除 sys_salary 表中的 cashPaid 字段
-- 执行日期：2025-10-16
-- 说明：cashPaid（已发现金）字段不再使用，需要从数据库中删除

-- 注意：执行此脚本前，请确保已经备份数据库！

-- 1. 删除 cashPaid 字段
ALTER TABLE sys_salary DROP COLUMN cashPaid;

-- 2. 验证字段已删除
-- 执行以下查询，确认 cashPaid 字段不再存在
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'sys_salary' 
  AND TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'cashPaid';
-- 如果返回空结果，表示字段已成功删除

-- 3. 查看表结构（可选）
DESCRIBE sys_salary;

