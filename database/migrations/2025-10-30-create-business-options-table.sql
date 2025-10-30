-- 业务选项表创建脚本
-- 创建时间: 2025-10-30
-- 说明: 用于存储和管理各类业务的可选项,支持默认选项和自定义选项

CREATE TABLE IF NOT EXISTS `business_options` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `category` VARCHAR(100) NOT NULL COMMENT '业务类别（如：change_business, administrative_license 等）',
  `option_value` VARCHAR(200) NOT NULL COMMENT '选项值',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为默认选项（0-否，1-是）',
  `created_by` VARCHAR(100) DEFAULT NULL COMMENT '创建人',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_option` (`category`, `option_value`),
  KEY `idx_category` (`category`),
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务选项表';

-- 验证表是否创建成功
SELECT 
  TABLE_NAME,
  TABLE_COMMENT,
  ENGINE,
  TABLE_COLLATION
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'business_options';

-- 查看表结构
DESCRIBE business_options;

-- 查看索引信息
SHOW INDEX FROM business_options;

