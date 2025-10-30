-- 业务选项默认数据初始化脚本
-- 创建时间: 2025-10-30
-- 说明: 初始化所有业务类别的默认选项数据

-- 清空现有数据（可选，仅在全新部署时使用）
-- TRUNCATE TABLE business_options;

-- 1. 变更业务 (change_business) 默认选项
INSERT INTO `business_options` (`category`, `option_value`, `is_default`, `created_by`) VALUES
('change_business', '地址变更', 0, 'system'),
('change_business', '名称变更', 0, 'system'),
('change_business', '股东变更', 0, 'system'),
('change_business', '监事变更', 0, 'system'),
('change_business', '范围变更', 0, 'system'),
('change_business', '注册资本变更', 0, 'system'),
('change_business', '跨区域变更', 0, 'system'),
('change_business', '法定代表人变更', 0, 'system'),
('change_business', '个升企', 0, 'system')
ON DUPLICATE KEY UPDATE 
  `is_default` = VALUES(`is_default`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 2. 行政许可 (administrative_license) 默认选项
INSERT INTO `business_options` (`category`, `option_value`, `is_default`, `created_by`) VALUES
('administrative_license', '食品经营许可证', 0, 'system'),
('administrative_license', '卫生许可证', 0, 'system'),
('administrative_license', '酒类经营许可证', 0, 'system'),
('administrative_license', '道路运输许可证', 0, 'system'),
('administrative_license', '医疗器械经营许可证', 0, 'system'),
('administrative_license', '建筑施工许可证', 0, 'system'),
('administrative_license', '特种行业许可证', 0, 'system')
ON DUPLICATE KEY UPDATE 
  `is_default` = VALUES(`is_default`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 3. 其他业务（基础）(other_business_basic) 默认选项
INSERT INTO `business_options` (`category`, `option_value`, `is_default`, `created_by`) VALUES
('other_business_basic', '非代理企业工商注销', 0, 'system'),
('other_business_basic', '非代理企业税务注销', 0, 'system'),
('other_business_basic', '非代理企业银行注销', 0, 'system'),
('other_business_basic', '税务处理逾期/补充申报', 0, 'system'),
('other_business_basic', '工商年报/工商公示', 0, 'system'),
('other_business_basic', '补执照', 0, 'system'),
('other_business_basic', '报表编制', 0, 'system'),
('other_business_basic', '非代理企业行政许可注销', 0, 'system'),
('other_business_basic', '银行开户', 0, 'system'),
('other_business_basic', '银行变更', 0, 'system')
ON DUPLICATE KEY UPDATE 
  `is_default` = VALUES(`is_default`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 4. 其他业务(外包) (other_business_outsourcing) 默认选项
INSERT INTO `business_options` (`category`, `option_value`, `is_default`, `created_by`) VALUES
('other_business_outsourcing', '代理企业工商注销', 0, 'system'),
('other_business_outsourcing', '代理企业税务注销', 0, 'system'),
('other_business_outsourcing', '代理企业银行注销', 0, 'system'),
('other_business_outsourcing', '代理企业注销', 0, 'system'),
('other_business_outsourcing', '解除工商异常', 0, 'system'),
('other_business_outsourcing', '解除税务异常', 0, 'system'),
('other_business_outsourcing', '代办条形码', 0, 'system'),
('other_business_outsourcing', '劳务派遣证年检', 0, 'system'),
('other_business_outsourcing', '民非证年检', 0, 'system'),
('other_business_outsourcing', '公司转让', 0, 'system'),
('other_business_outsourcing', '建设项目环境影响登记表', 0, 'system'),
('other_business_outsourcing', '代办固定污染源排污', 0, 'system'),
('other_business_outsourcing', '登报', 0, 'system'),
('other_business_outsourcing', '商标注册', 0, 'system'),
('other_business_outsourcing', '商标变更', 0, 'system'),
('other_business_outsourcing', '商标续展', 0, 'system'),
('other_business_outsourcing', '商标过户', 0, 'system'),
('other_business_outsourcing', '审计报告', 0, 'system'),
('other_business_outsourcing', '检测报告', 0, 'system'),
('other_business_outsourcing', '验资报告', 0, 'system'),
('other_business_outsourcing', '出版物许可证', 0, 'system'),
('other_business_outsourcing', '著作权', 0, 'system'),
('other_business_outsourcing', '版权', 0, 'system'),
('other_business_outsourcing', '建筑资质证书', 0, 'system'),
('other_business_outsourcing', '3A信用认证', 0, 'system'),
('other_business_outsourcing', '质量体系认证（环境、健康、职业）', 0, 'system'),
('other_business_outsourcing', '信用修复', 0, 'system'),
('other_business_outsourcing', '暂住证', 0, 'system'),
('other_business_outsourcing', '贷款业务', 0, 'system'),
('other_business_outsourcing', '金融业务', 0, 'system'),
('other_business_outsourcing', '资产评估报告', 0, 'system'),
('other_business_outsourcing', '区块链', 0, 'system'),
('other_business_outsourcing', '招标投标代理', 0, 'system'),
('other_business_outsourcing', '工程审计/预算/决算', 0, 'system'),
('other_business_outsourcing', '标书制作', 0, 'system'),
('other_business_outsourcing', '定位服务', 0, 'system'),
('other_business_outsourcing', '活动费用', 0, 'system'),
('other_business_outsourcing', '执行标准', 0, 'system'),
('other_business_outsourcing', '外包地址', 0, 'system'),
('other_business_outsourcing', '税务风险报告', 0, 'system'),
('other_business_outsourcing', '代理企业行政许可注销', 0, 'system'),
('other_business_outsourcing', '公司合作业务', 0, 'system')
ON DUPLICATE KEY UPDATE 
  `is_default` = VALUES(`is_default`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 5. 其他业务（特殊）(other_business_special) 默认选项
INSERT INTO `business_options` (`category`, `option_value`, `is_default`, `created_by`) VALUES
('other_business_special', '代办烟草证', 0, 'system'),
('other_business_special', '出口退税', 0, 'system'),
('other_business_special', '建筑资质证书', 0, 'system')
ON DUPLICATE KEY UPDATE 
  `is_default` = VALUES(`is_default`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 验证数据是否插入成功
SELECT 
  category AS '业务类别',
  COUNT(*) AS '选项数量',
  SUM(CASE WHEN is_default = 1 THEN 1 ELSE 0 END) AS '默认选项数量',
  SUM(CASE WHEN is_default = 0 THEN 1 ELSE 0 END) AS '自定义选项数量'
FROM business_options
GROUP BY category
ORDER BY category;

-- 查看所有默认选项
SELECT 
  id,
  category AS '业务类别',
  option_value AS '选项值',
  CASE WHEN is_default = 1 THEN '是' ELSE '否' END AS '是否默认',
  created_by AS '创建人',
  created_at AS '创建时间'
FROM business_options
WHERE is_default = 1
ORDER BY category, created_at;

-- 统计信息
SELECT 
  '总记录数' AS '统计项',
  COUNT(*) AS '数量'
FROM business_options
UNION ALL
SELECT 
  '默认选项数' AS '统计项',
  COUNT(*) AS '数量'
FROM business_options
WHERE is_default = 1
UNION ALL
SELECT 
  '自定义选项数' AS '统计项',
  COUNT(*) AS '数量'
FROM business_options
WHERE is_default = 0;

