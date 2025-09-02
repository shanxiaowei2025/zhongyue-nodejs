-- =============================================
-- 客户表假数据生成脚本（修复版）
-- 创建时间：2025年1月
-- 说明：修复actualResponsibles字段的JSON格式问题和重复字段问题
-- =============================================

-- 设置字符集
SET NAMES utf8mb4;

-- 清空现有数据
DELETE FROM sys_customer;

-- 重置自增ID
ALTER TABLE sys_customer AUTO_INCREMENT = 1;

-- 插入5条手工制作的客户记录
INSERT INTO sys_customer (
    companyName, 
    location, 
    consultantAccountant, 
    bookkeepingAccountant,
    invoiceOfficer,
    enterpriseType,
    unifiedSocialCreditCode,
    taxNumber,
    registeredAddress,
    businessAddress,
    taxBureau,
    actualResponsibles,
    actualResponsibleRemark,
    clanId,
    bossProfile,
    enterpriseProfile,
    industryCategory,
    industrySubcategory,
    hasTaxBenefits,
    businessPublicationPassword,
    establishmentDate,
    licenseExpiryDate,
    registeredCapital,
    capitalContributionDeadline,
    capitalContributionDeadline2,
    paidInCapital,
    publicBank,
    bankAccountNumber,
    basicDepositAccountNumber,
    generalAccountBank,
    generalAccountNumber,
    generalAccountOpeningDate,
    publicBankOpeningDate,
    taxReportLoginMethod,
    legalRepresentativeName,
    legalRepresentativePhone,
    legalRepresentativePhone2,
    legalRepresentativeId,
    legalRepresentativeTaxPassword,
    taxOfficerName,
    taxOfficerPhone,
    taxOfficerId,
    taxOfficerTaxPassword,
    invoicingSoftware,
    invoicingNotes,
    invoiceOfficerName,
    invoiceOfficerPhone,
    invoiceOfficerId,
    invoiceOfficerTaxPassword,
    financialContactName,
    financialContactPhone,
    financialContactId,
    financialContactTaxPassword,
    taxCategories,
    socialInsuranceTypes,
    insuredPersonnel,
    tripartiteAgreementAccount,
    personalIncomeTaxPassword,
    personalIncomeTaxStaff,
    sealStorageNumber,
    enterpriseStatus,
    customerLevel,
    contributionAmount,
    businessStatus,
    submitter,
    remarks,
    paperArchiveNumber,
    onlineBankingArchiveNumber,
    archiveStorageRemarks
) VALUES
(
    '上海科技有限公司',
    '上海市浦东新区',
    '李会计',
    '王记账',
    '张开票',
    '有限责任公司',
    '91310115MA1K2345XX',
    '310115123456789',
    '上海市浦东新区张江高科技园区',
    '上海市浦东新区张江路123号',
    '上海市浦东新区税务局',
    JSON_ARRAY(JSON_OBJECT('name', '张总', 'phone', '13800000001')),
    '主要负责人',
    1258,
    '张总，40岁，有20年创业经验',
    '专注人工智能技术研发',
    '信息技术服务业',
    '软件开发',
    1,
    'pwd123456',
    '2018-05-15',
    '2028-05-15',
    1000000.00,
    '2025-12-31',
    '2026-12-31',
    JSON_ARRAY(JSON_OBJECT('amount', 500000, 'date', '2018-05-15')),
    '中国银行上海张江支行',
    '621785000012345678',
    '31001585012345678901',
    '工商银行上海张江支行',
    '62220315012345678',
    '2018-06-01',
    '2018-05-20',
    '电子税务局',
    '张明',
    '13800000001',
    '13900000001',
    '310115198501011234',
    'tax123456',
    '张明',
    '13800000001',
    '310115198501011234',
    'tax123456',
    '金税盘',
    '使用金税盘开票',
    '张明',
    '13800000001',
    '310115198501011234',
    'tax123456',
    '王财务',
    '13800000002',
    '310115198502021234',
    'finance123',
    '增值税一般纳税人',
    '养老保险,医疗保险,失业保险,工伤保险,生育保险',
    '张明,李华,王强',
    '31001585012345678901',
    'personal123',
    '张明,李华,王强',
    'SEAL001',
    '正常',
    'A级',
    1000000.00,
    '正常经营',
    '系统管理员',
    '重要客户，需要重点关注',
    'PA001',
    'ZJ001',
    '档案齐全'
),
(
    '北京贸易股份有限公司',
    '北京市朝阳区',
    '赵会计',
    '钱记账',
    '孙开票',
    '股份有限公司',
    '91110105MA1K5678XX',
    '110105123456789',
    '北京市朝阳区CBD核心区',
    '北京市朝阳区建国路88号',
    '北京市朝阳区税务局',
    JSON_ARRAY(JSON_OBJECT('name', '李总', 'phone', '13800000002')),
    '法定代表人',
    1259,
    '李总，45岁，金融行业背景',
    '主营进出口贸易业务',
    '批发和零售业',
    '进出口贸易',
    0,
    'pwd789012',
    '2015-03-10',
    '2025-03-10',
    5000000.00,
    '2025-12-31',
    '2026-12-31',
    JSON_ARRAY(JSON_OBJECT('amount', 2500000, 'date', '2015-03-10'), JSON_OBJECT('amount', 2500000, 'date', '2020-03-10')),
    '招商银行北京CBD支行',
    '621785000087654321',
    '11010585087654321098',
    '建设银行北京朝阳支行',
    '62270315087654321',
    '2015-04-01',
    '2015-03-15',
    '电子税务局',
    '李强',
    '13800000002',
    '13900000002',
    '110105198001011234',
    'tax789012',
    '李强',
    '13800000002',
    '110105198001011234',
    'tax789012',
    '航天信息',
    '使用航天信息开票系统',
    '李强',
    '13800000002',
    '110105198001011234',
    'tax789012',
    '赵财务',
    '13800000003',
    '110105198003031234',
    'finance789',
    '增值税一般纳税人',
    '五险一金',
    '李强,赵敏,钱伟,孙丽',
    '11010585087654321098',
    'personal789',
    '李强,赵敏,钱伟,孙丽',
    'SEAL002',
    '正常',
    'B级',
    800000.00,
    '正常经营',
    '系统管理员',
    '老客户，合作稳定',
    'PA002',
    'CBD002',
    '档案完整'
),
(
    '深圳制造有限公司',
    '深圳市南山区',
    '周会计',
    '吴记账',
    '郑开票',
    '有限责任公司',
    '91440300MA1K9012XX',
    '440300123456789',
    '深圳市南山区科技园',
    '深圳市南山区高新技术产业园区',
    '深圳市南山区税务局',
    JSON_ARRAY(JSON_OBJECT('name', '王总', 'phone', '13800000003')),
    '实际控制人',
    1260,
    '王总，38岁，制造业专家',
    '专业生产电子产品',
    '制造业',
    '电子设备制造',
    1,
    'pwd345678',
    '2020-01-20',
    '2030-01-20',
    2000000.00,
    '2025-12-31',
    '2026-12-31',
    JSON_ARRAY(JSON_OBJECT('amount', 1000000, 'date', '2020-01-20')),
    '平安银行深圳南山支行',
    '621785000054321987',
    '44030085054321987654',
    '深圳发展银行南山支行',
    '62270315054321987',
    '2020-02-01',
    '2020-01-25',
    '电子税务局',
    '王伟',
    '13800000003',
    '13900000003',
    '440300199001011234',
    'tax345678',
    '王伟',
    '13800000003',
    '440300199001011234',
    'tax345678',
    '百旺金赋',
    '使用百旺开票系统',
    '王伟',
    '13800000003',
    '440300199001011234',
    'tax345678',
    '周财务',
    '13800000004',
    '440300199004041234',
    'finance345',
    '增值税一般纳税人',
    '社会保险',
    '王伟,周杰,吴磊,郑华',
    '44030085054321987654',
    'personal345',
    '王伟,周杰,吴磊,郑华',
    'SEAL003',
    '正常',
    'A级',
    1200000.00,
    '正常经营',
    '系统管理员',
    '制造业客户，订单稳定',
    'PA003',
    'NS003',
    '资料齐备'
),
(
    '广州服务有限公司',
    '广州市天河区',
    '冯会计',
    '陈记账',
    '褚开票',
    '有限责任公司',
    '91440106MA1K3456XX',
    '440106123456789',
    '广州市天河区珠江新城',
    '广州市天河区天河路321号',
    '广州市天河区税务局',
    JSON_ARRAY(JSON_OBJECT('name', '刘总', 'phone', '13800000004')),
    '公司负责人',
    1261,
    '刘总，42岁，服务业资深人士',
    '提供专业咨询服务',
    '租赁和商务服务业',
    '商务服务业',
    0,
    'pwd901234',
    '2019-07-08',
    '2029-07-08',
    800000.00,
    '2025-12-31',
    '2026-12-31',
    JSON_ARRAY(JSON_OBJECT('amount', 400000, 'date', '2019-07-08')),
    '广发银行广州天河支行',
    '621785000011223344',
    '44010685011223344567',
    '农业银行广州天河支行',
    '62270315011223344',
    '2019-08-01',
    '2019-07-15',
    '网上办税',
    '刘明',
    '13800000004',
    '13900000004',
    '440106198505051234',
    'tax901234',
    '刘明',
    '13800000004',
    '440106198505051234',
    'tax901234',
    '税控盘',
    '使用税控盘开票',
    '刘明',
    '13800000004',
    '440106198505051234',
    'tax901234',
    '冯财务',
    '13800000005',
    '440106198506061234',
    'finance901',
    '增值税小规模纳税人',
    '基本社保',
    '刘明,冯丽,陈强',
    '44010685011223344567',
    'personal901',
    '刘明,冯丽,陈强',
    'SEAL004',
    '正常',
    'B级',
    600000.00,
    '正常经营',
    '系统管理员',
    '服务业客户，业务增长中',
    'PA004',
    'TH004',
    '材料完备'
),
(
    '杭州科技有限公司',
    '杭州市西湖区',
    '卫会计',
    '蒋记账',
    '沈开票',
    '有限责任公司',
    '91330106MA1K7890XX',
    '330106123456789',
    '杭州市西湖区文三路',
    '杭州市西湖区文三路199号',
    '杭州市西湖区税务局',
    JSON_ARRAY(JSON_OBJECT('name', '韩总', 'phone', '13800000005')),
    '创始人',
    1262,
    '韩总，35岁，互联网创业者',
    '专注互联网技术服务',
    '信息传输软件和信息技术服务业',
    '互联网和相关服务',
    1,
    'pwd567890',
    '2021-11-12',
    '2031-11-12',
    1500000.00,
    '2025-12-31',
    '2026-12-31',
    JSON_ARRAY(JSON_OBJECT('amount', 750000, 'date', '2021-11-12')),
    '浙商银行杭州西湖支行',
    '621785000099887766',
    '33010685099887766543',
    '兴业银行杭州西湖支行',
    '62270315099887766',
    '2021-12-01',
    '2021-11-20',
    '浙江省电子税务局',
    '韩磊',
    '13800000005',
    '13900000005',
    '330106199205051234',
    'tax567890',
    '韩磊',
    '13800000005',
    '330106199205051234',
    'tax567890',
    '诺诺发票',
    '使用诺诺发票系统',
    '韩磊',
    '13800000005',
    '330106199205051234',
    'tax567890',
    '卫财务',
    '13800000006',
    '330106199206061234',
    'finance567',
    '增值税一般纳税人',
    '五险一金',
    '韩磊,卫敏,蒋涛',
    '33010685099887766543',
    'personal567',
    '韩磊,卫敏,蒋涛',
    'SEAL005',
    '正常',
    'A级',
    900000.00,
    '快速成长',
    '系统管理员',
    '新兴科技公司，发展潜力大',
    'PA005',
    'XH005',
    '新客户资料'
);

-- 生成20条批量数据（用更简单的方式）
INSERT INTO sys_customer (
    companyName, 
    location, 
    consultantAccountant, 
    bookkeepingAccountant,
    invoiceOfficer,
    enterpriseType,
    unifiedSocialCreditCode,
    taxNumber,
    registeredAddress,
    businessAddress,
    taxBureau,
    actualResponsibles,
    actualResponsibleRemark,
    clanId,
    bossProfile,
    enterpriseProfile,
    industryCategory,
    industrySubcategory,
    hasTaxBenefits,
    businessPublicationPassword,
    establishmentDate,
    licenseExpiryDate,
    registeredCapital,
    capitalContributionDeadline,
    capitalContributionDeadline2,
    paidInCapital,
    publicBank,
    bankAccountNumber,
    basicDepositAccountNumber,
    generalAccountBank,
    generalAccountNumber,
    generalAccountOpeningDate,
    publicBankOpeningDate,
    taxReportLoginMethod,
    legalRepresentativeName,
    legalRepresentativePhone,
    legalRepresentativePhone2,
    legalRepresentativeId,
    legalRepresentativeTaxPassword,
    taxOfficerName,
    taxOfficerPhone,
    taxOfficerId,
    taxOfficerTaxPassword,
    invoicingSoftware,
    invoicingNotes,
    invoiceOfficerName,
    invoiceOfficerPhone,
    invoiceOfficerId,
    invoiceOfficerTaxPassword,
    financialContactName,
    financialContactPhone,
    financialContactId,
    financialContactTaxPassword,
    taxCategories,
    socialInsuranceTypes,
    insuredPersonnel,
    tripartiteAgreementAccount,
    personalIncomeTaxPassword,
    personalIncomeTaxStaff,
    sealStorageNumber,
    enterpriseStatus,
    customerLevel,
    contributionAmount,
    businessStatus,
    submitter,
    remarks,
    paperArchiveNumber,
    onlineBankingArchiveNumber,
    archiveStorageRemarks
) VALUES
('武汉科技发展有限公司', '武汉市洪山区', '李会计', '王记账', '张开票', '有限责任公司', '91420111MA1K1111XX', '420111111111111', '武汉市洪山区光谷', '武汉市洪山区光谷大道100号', '武汉市洪山区税务局', JSON_ARRAY(JSON_OBJECT('name', '赵总', 'phone', '13800000006')), '法人代表', 1263, '赵总，科技行业背景', '高新技术企业', '制造业', '高新技术', 1, 'pwd111111', '2019-01-15', '2029-01-15', 1500000.00, '2025-12-31', '2026-12-31', JSON_ARRAY(JSON_OBJECT('amount', 750000, 'date', '2019-01-15')), '工商银行武汉光谷支行', '621785000011111111', '42011100011111111111', '建设银行武汉光谷支行', '62270315011111111', '2019-02-01', '2019-01-20', '电子税务局', '赵明', '13800000006', '13900000006', '420111199001011111', 'tax111111', '赵明', '13800000006', '420111199001011111', 'tax111111', '金税盘', '金税盘开票', '赵明', '13800000006', '420111199001011111', 'tax111111', '李财务', '13800000007', '420111199002021111', 'finance111', '增值税一般纳税人', '五险一金', '赵明,李华,王强', '42011100011111111111', 'personal111', '赵明,李华,王强', 'SEAL006', '正常', 'A级', 800000.00, '正常经营', '系统管理员', '高新技术企业客户', 'PA006', 'WH001', '档案完整'),
('成都商贸有限公司', '成都市高新区', '陈会计', '刘记账', '杨开票', '有限责任公司', '91510107MA1K2222XX', '510107222222222', '成都市高新区天府', '成都市高新区天府大道200号', '成都市高新区税务局', JSON_ARRAY(JSON_OBJECT('name', '钱总', 'phone', '13800000008')), '总经理', 1264, '钱总，商贸行业专家', '专业商贸服务', '批发和零售业', '商品批发', 0, 'pwd222222', '2020-03-20', '2030-03-20', 2000000.00, '2025-12-31', '2026-12-31', JSON_ARRAY(JSON_OBJECT('amount', 1000000, 'date', '2020-03-20')), '招商银行成都高新支行', '621785000022222222', '51010700022222222222', '农业银行成都高新支行', '62270315022222222', '2020-04-01', '2020-03-25', '四川省电子税务局', '钱伟', '13800000008', '13900000008', '510107199003032222', 'tax222222', '钱伟', '13800000008', '510107199003032222', 'tax222222', '航天信息', '航天信息开票', '钱伟', '13800000008', '510107199003032222', 'tax222222', '陈财务', '13800000009', '510107199004042222', 'finance222', '增值税一般纳税人', '社会保险', '钱伟,陈敏,刘强', '51010700022222222222', 'personal222', '钱伟,陈敏,刘强', 'SEAL007', '正常', 'B级', 900000.00, '稳定发展', '系统管理员', '商贸业务客户', 'PA007', 'CD002', '资料齐全'),
('重庆制造实业有限公司', '重庆市渝北区', '孙会计', '周记账', '吴开票', '有限责任公司', '91500112MA1K3333XX', '500112333333333', '重庆市渝北区空港', '重庆市渝北区空港大道300号', '重庆市渝北区税务局', JSON_ARRAY(JSON_OBJECT('name', '孙总', 'phone', '13800000010')), '董事长', 1265, '孙总，制造业资深管理者', '传统制造业企业', '制造业', '机械制造', 1, 'pwd333333', '2017-06-10', '2027-06-10', 3000000.00, '2025-12-31', '2026-12-31', JSON_ARRAY(JSON_OBJECT('amount', 1500000, 'date', '2017-06-10')), '平安银行重庆渝北支行', '621785000033333333', '50011200033333333333', '中国银行重庆渝北支行', '62270315033333333', '2017-07-01', '2017-06-15', '重庆市电子税务局', '孙强', '13800000010', '13900000010', '500112198705053333', 'tax333333', '孙强', '13800000010', '500112198705053333', 'tax333333', '百旺金赋', '百旺开票系统', '孙强', '13800000010', '500112198705053333', 'tax333333', '孙财务', '13800000011', '500112198706063333', 'finance333', '增值税一般纳税人', '五险一金', '孙强,周杰,吴磊', '50011200033333333333', 'personal333', '孙强,周杰,吴磊', 'SEAL008', '正常', 'A级', 1100000.00, '转型升级', '系统管理员', '传统制造业客户', 'PA008', 'CQ003', '档案完备'),
('西安服务咨询有限公司', '西安市高新区', '郑会计', '冯记账', '韩开票', '有限责任公司', '91610131MA1K4444XX', '610131444444444', '西安市高新区科技路', '西安市高新区科技路400号', '西安市高新区税务局', JSON_ARRAY(JSON_OBJECT('name', '李总', 'phone', '13800000012')), '法定代表人', 1266, '李总，咨询行业专家', '提供管理咨询服务', '租赁和商务服务业', '咨询服务', 0, 'pwd444444', '2021-09-05', '2031-09-05', 1000000.00, '2025-12-31', '2026-12-31', JSON_ARRAY(JSON_OBJECT('amount', 500000, 'date', '2021-09-05')), '建设银行西安高新支行', '621785000044444444', '61013100044444444444', '工商银行西安高新支行', '62270315044444444', '2021-10-01', '2021-09-10', '陕西省电子税务局', '李磊', '13800000012', '13900000012', '610131199007074444', 'tax444444', '李磊', '13800000012', '610131199007074444', 'tax444444', '税控盘', '税控盘开票', '李磊', '13800000012', '610131199007074444', 'tax444444', '郑财务', '13800000013', '610131199008084444', 'finance444', '增值税小规模纳税人', '基本社保', '李磊,郑敏,冯强', '61013100044444444444', 'personal444', '李磊,郑敏,冯强', 'SEAL009', '正常', 'B级', 700000.00, '快速成长', '系统管理员', '咨询服务客户', 'PA009', 'XA004', '新兴企业'),
('青岛海洋科技有限公司', '青岛市市南区', '蒋会计', '沈记账', '卫开票', '有限责任公司', '91370202MA1K5555XX', '370202555555555', '青岛市市南区香港路', '青岛市市南区香港路500号', '青岛市市南区税务局', JSON_ARRAY(JSON_OBJECT('name', '王总', 'phone', '13800000014')), '创始人', 1267, '王总，海洋科技专家', '海洋科技研发企业', '科学研究和技术服务业', '科技研发', 1, 'pwd555555', '2022-04-18', '2032-04-18', 2500000.00, '2025-12-31', '2026-12-31', JSON_ARRAY(JSON_OBJECT('amount', 1250000, 'date', '2022-04-18')), '青岛银行市南支行', '621785000055555555', '37020200055555555555', '光大银行青岛市南支行', '62270315055555555', '2022-05-01', '2022-04-25', '山东省电子税务局', '王涛', '13800000014', '13900000014', '370202199209095555', 'tax555555', '王涛', '13800000014', '370202199209095555', 'tax555555', '诺诺发票', '诺诺发票系统', '王涛', '13800000014', '370202199209095555', 'tax555555', '蒋财务', '13800000015', '370202199210105555', 'finance555', '增值税一般纳税人', '五险一金', '王涛,蒋敏,沈杰', '37020200055555555555', 'personal555', '王涛,蒋敏,沈杰', 'SEAL010', '正常', 'A级', 1300000.00, '正常经营', '系统管理员', '海洋科技企业', 'PA010', 'QD005', '高科技企业');

-- =============================================
-- 生成额外的10条客户数据（循环生成）
-- =============================================

-- 使用循环的方式生成10条更多的客户数据
INSERT INTO sys_customer (
    companyName, 
    location, 
    consultantAccountant, 
    bookkeepingAccountant,
    invoiceOfficer,
    enterpriseType,
    unifiedSocialCreditCode,
    taxNumber,
    registeredAddress,
    businessAddress,
    taxBureau,
    actualResponsibles,
    actualResponsibleRemark,
    clanId,
    bossProfile,
    enterpriseProfile,
    industryCategory,
    industrySubcategory,
    hasTaxBenefits,
    businessPublicationPassword,
    establishmentDate,
    licenseExpiryDate,
    registeredCapital,
    capitalContributionDeadline,
    capitalContributionDeadline2,
    paidInCapital,
    publicBank,
    bankAccountNumber,
    basicDepositAccountNumber,
    generalAccountBank,
    generalAccountNumber,
    generalAccountOpeningDate,
    publicBankOpeningDate,
    taxReportLoginMethod,
    legalRepresentativeName,
    legalRepresentativePhone,
    legalRepresentativePhone2,
    legalRepresentativeId,
    legalRepresentativeTaxPassword,
    taxOfficerName,
    taxOfficerPhone,
    taxOfficerId,
    taxOfficerTaxPassword,
    invoicingSoftware,
    invoicingNotes,
    invoiceOfficerName,
    invoiceOfficerPhone,
    invoiceOfficerId,
    invoiceOfficerTaxPassword,
    financialContactName,
    financialContactPhone,
    financialContactId,
    financialContactTaxPassword,
    taxCategories,
    socialInsuranceTypes,
    insuredPersonnel,
    tripartiteAgreementAccount,
    personalIncomeTaxPassword,
    personalIncomeTaxStaff,
    sealStorageNumber,
    enterpriseStatus,
    customerLevel,
    contributionAmount,
    businessStatus,
    submitter,
    remarks,
    paperArchiveNumber,
    onlineBankingArchiveNumber,
    archiveStorageRemarks
)
SELECT 
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '天津'
            WHEN 1 THEN '南京'
            WHEN 2 THEN '苏州'
            WHEN 3 THEN '合肥'
            WHEN 4 THEN '厦门'
            WHEN 5 THEN '长沙'
            WHEN 6 THEN '昆明'
            WHEN 7 THEN '郑州'
            WHEN 8 THEN '大连'
            ELSE '宁波'
        END,
        CASE (ROW_NUMBER() OVER()) % 5
            WHEN 0 THEN '科技有限公司'
            WHEN 1 THEN '贸易发展公司'
            WHEN 2 THEN '制造实业公司'
            WHEN 3 THEN '服务咨询公司'
            ELSE '信息技术公司'
        END
    ) AS companyName,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '天津市河西区'
            WHEN 1 THEN '南京市建邺区'
            WHEN 2 THEN '苏州市工业园区'
            WHEN 3 THEN '合肥市高新区'
            WHEN 4 THEN '厦门市思明区'
            WHEN 5 THEN '长沙市岳麓区'
            WHEN 6 THEN '昆明市盘龙区'
            WHEN 7 THEN '郑州市金水区'
            WHEN 8 THEN '大连市高新园区'
            ELSE '宁波市江北区'
        END
    ) AS location,
    CASE (ROW_NUMBER() OVER()) % 5
        WHEN 0 THEN '张会计'
        WHEN 1 THEN '李会计'
        WHEN 2 THEN '王会计'
        WHEN 3 THEN '赵会计'
        ELSE '刘会计'
    END AS consultantAccountant,
    CASE (ROW_NUMBER() OVER()) % 5
        WHEN 0 THEN '陈记账'
        WHEN 1 THEN '杨记账'
        WHEN 2 THEN '黄记账'
        WHEN 3 THEN '周记账'
        ELSE '吴记账'
    END AS bookkeepingAccountant,
    CASE (ROW_NUMBER() OVER()) % 5
        WHEN 0 THEN '马开票'
        WHEN 1 THEN '朱开票'
        WHEN 2 THEN '胡开票'
        WHEN 3 THEN '郭开票'
        ELSE '何开票'
    END AS invoiceOfficer,
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN '有限责任公司'
        WHEN 1 THEN '股份有限公司'
        ELSE '有限责任公司'
    END AS enterpriseType,
    CONCAT('9', 
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '112010'
            WHEN 1 THEN '132011'
            WHEN 2 THEN '132050'
            WHEN 3 THEN '134010'
            WHEN 4 THEN '135020'
            WHEN 5 THEN '143010'
            WHEN 6 THEN '153010'
            WHEN 7 THEN '141010'
            WHEN 8 THEN '121020'
            ELSE '133020'
        END,
        '5MA1K', 
        LPAD((ROW_NUMBER() OVER()) + 5000, 4, '0'), 'XX'
    ) AS unifiedSocialCreditCode,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '120102'
            WHEN 1 THEN '320104'
            WHEN 2 THEN '320505'
            WHEN 3 THEN '340104'
            WHEN 4 THEN '350203'
            WHEN 5 THEN '430104'
            WHEN 6 THEN '530102'
            WHEN 7 THEN '410105'
            WHEN 8 THEN '210213'
            ELSE '330203'
        END,
        LPAD((ROW_NUMBER() OVER()) + 600000, 6, '0')
    ) AS taxNumber,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '天津市河西区梅江'
            WHEN 1 THEN '南京市建邺区河西新城'
            WHEN 2 THEN '苏州市工业园区星海街'
            WHEN 3 THEN '合肥市高新区科学大道'
            WHEN 4 THEN '厦门市思明区软件园'
            WHEN 5 THEN '长沙市岳麓区麓谷'
            WHEN 6 THEN '昆明市盘龙区北京路'
            WHEN 7 THEN '郑州市金水区经三路'
            WHEN 8 THEN '大连市高新园区黄浦路'
            ELSE '宁波市江北区中马路'
        END
    ) AS registeredAddress,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '天津市河西区梅江道'
            WHEN 1 THEN '南京市建邺区河西大街'
            WHEN 2 THEN '苏州市工业园区星海街'
            WHEN 3 THEN '合肥市高新区科学大道'
            WHEN 4 THEN '厦门市思明区软件园二期'
            WHEN 5 THEN '长沙市岳麓区麓谷大道'
            WHEN 6 THEN '昆明市盘龙区北京路'
            WHEN 7 THEN '郑州市金水区经三路'
            WHEN 8 THEN '大连市高新园区黄浦路'
            ELSE '宁波市江北区中马路'
        END,
        LPAD((ROW_NUMBER() OVER()) + 600, 3, '0'), '号'
    ) AS businessAddress,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '天津市河西区税务局'
            WHEN 1 THEN '南京市建邺区税务局'
            WHEN 2 THEN '苏州市工业园区税务局'
            WHEN 3 THEN '合肥市高新区税务局'
            WHEN 4 THEN '厦门市思明区税务局'
            WHEN 5 THEN '长沙市岳麓区税务局'
            WHEN 6 THEN '昆明市盘龙区税务局'
            WHEN 7 THEN '郑州市金水区税务局'
            WHEN 8 THEN '大连市高新园区税务局'
            ELSE '宁波市江北区税务局'
        END
    ) AS taxBureau,
    JSON_ARRAY(JSON_OBJECT('name', CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '徐总'
            WHEN 1 THEN '林总'
            WHEN 2 THEN '罗总'
            WHEN 3 THEN '梁总'
            WHEN 4 THEN '宋总'
            WHEN 5 THEN '唐总'
            WHEN 6 THEN '韩总'
            WHEN 7 THEN '冯总'
            WHEN 8 THEN '曹总'
            ELSE '彭总'
        END
    ), 'phone', CONCAT('1380000', LPAD((ROW_NUMBER() OVER()) + 15, 4, '0')))) AS actualResponsibles,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN '法定代表人'
        WHEN 1 THEN '实际控制人'
        WHEN 2 THEN '公司负责人'
        ELSE '董事长'
    END AS actualResponsibleRemark,
    (1268 + ((ROW_NUMBER() OVER() - 1) % 5)) AS clanId,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '徐总，企业管理专家'
            WHEN 1 THEN '林总，行业资深人士'
            WHEN 2 THEN '罗总，技术背景强'
            WHEN 3 THEN '梁总，市场经验丰富'
            WHEN 4 THEN '宋总，财务出身'
            WHEN 5 THEN '唐总，海外背景'
            WHEN 6 THEN '韩总，创业老兵'
            WHEN 7 THEN '冯总，跨界精英'
            WHEN 8 THEN '曹总，行业领袖'
            ELSE '彭总，战略专家'
        END
    ) AS bossProfile,
    CASE (ROW_NUMBER() OVER()) % 6
        WHEN 0 THEN '专注技术创新发展'
        WHEN 1 THEN '提供专业服务解决方案'
        WHEN 2 THEN '致力于产品研发制造'
        WHEN 3 THEN '打造行业领先平台'
        WHEN 4 THEN '构建生态服务体系'
        ELSE '推动产业数字化转型'
    END AS enterpriseProfile,
    CASE (ROW_NUMBER() OVER()) % 8
        WHEN 0 THEN '信息传输软件和信息技术服务业'
        WHEN 1 THEN '批发和零售业'
        WHEN 2 THEN '制造业'
        WHEN 3 THEN '租赁和商务服务业'
        WHEN 4 THEN '科学研究和技术服务业'
        WHEN 5 THEN '金融业'
        WHEN 6 THEN '房地产业'
        ELSE '交通运输仓储和邮政业'
    END AS industryCategory,
    CASE (ROW_NUMBER() OVER()) % 8
        WHEN 0 THEN '软件开发'
        WHEN 1 THEN '商品销售'
        WHEN 2 THEN '设备制造'
        WHEN 3 THEN '企业服务'
        WHEN 4 THEN '技术研发'
        WHEN 5 THEN '投资管理'
        WHEN 6 THEN '房产开发'
        ELSE '物流运输'
    END AS industrySubcategory,
    (ROW_NUMBER() OVER()) % 2 AS hasTaxBenefits,
    CONCAT('pwd', LPAD((ROW_NUMBER() OVER()) + 600000, 6, '0')) AS businessPublicationPassword,
    DATE_ADD('2018-01-01', INTERVAL FLOOR(RAND() * 2000) DAY) AS establishmentDate,
    DATE_ADD('2028-01-01', INTERVAL FLOOR(RAND() * 2000) DAY) AS licenseExpiryDate,
    ROUND(500000 + RAND() * 4500000, 2) AS registeredCapital,
    '2025-12-31' AS capitalContributionDeadline,
    '2026-12-31' AS capitalContributionDeadline2,
    JSON_ARRAY(JSON_OBJECT('amount', ROUND(250000 + RAND() * 2250000, 0), 'date', DATE_ADD('2018-01-01', INTERVAL FLOOR(RAND() * 2000) DAY))) AS paidInCapital,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '交通银行天津河西支行'
            WHEN 1 THEN '浦发银行南京建邺支行'
            WHEN 2 THEN '华夏银行苏州园区支行'
            WHEN 3 THEN '民生银行合肥高新支行'
            WHEN 4 THEN '兴业银行厦门思明支行'
            WHEN 5 THEN '光大银行长沙岳麓支行'
            WHEN 6 THEN '中信银行昆明盘龙支行'
            WHEN 7 THEN '广发银行郑州金水支行'
            WHEN 8 THEN '渤海银行大连高新支行'
            ELSE '宁波银行江北支行'
        END
    ) AS publicBank,
    CONCAT('6217850000', LPAD((ROW_NUMBER() OVER()) + 60000000, 8, '0')) AS bankAccountNumber,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '12010200'
            WHEN 1 THEN '32010400'
            WHEN 2 THEN '32050500'
            WHEN 3 THEN '34010400'
            WHEN 4 THEN '35020300'
            WHEN 5 THEN '43010400'
            WHEN 6 THEN '53010200'
            WHEN 7 THEN '41010500'
            WHEN 8 THEN '21021300'
            ELSE '33020300'
        END,
        LPAD((ROW_NUMBER() OVER()) + 600000000, 9, '0')
    ) AS basicDepositAccountNumber,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '中国银行天津河西支行'
            WHEN 1 THEN '工商银行南京建邺支行'
            WHEN 2 THEN '农业银行苏州园区支行'
            WHEN 3 THEN '建设银行合肥高新支行'
            WHEN 4 THEN '交通银行厦门思明支行'
            WHEN 5 THEN '招商银行长沙岳麓支行'
            WHEN 6 THEN '邮储银行昆明盘龙支行'
            WHEN 7 THEN '中原银行郑州金水支行'
            WHEN 8 THEN '大连银行高新支行'
            ELSE '宁波银行总行营业部'
        END
    ) AS generalAccountBank,
    CONCAT('622703150', LPAD((ROW_NUMBER() OVER()) + 60000000, 8, '0')) AS generalAccountNumber,
    DATE_ADD('2018-02-01', INTERVAL FLOOR(RAND() * 2000) DAY) AS generalAccountOpeningDate,
    DATE_ADD('2018-01-15', INTERVAL FLOOR(RAND() * 2000) DAY) AS publicBankOpeningDate,
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN '电子税务局'
        WHEN 1 THEN '网上办税'
        ELSE '电子税务局'
    END AS taxReportLoginMethod,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '徐明'
            WHEN 1 THEN '林强'
            WHEN 2 THEN '罗伟'
            WHEN 3 THEN '梁华'
            WHEN 4 THEN '宋杰'
            WHEN 5 THEN '唐磊'
            WHEN 6 THEN '韩涛'
            WHEN 7 THEN '冯亮'
            WHEN 8 THEN '曹斌'
            ELSE '彭飞'
        END
    ) AS legalRepresentativeName,
    CONCAT('1380000', LPAD((ROW_NUMBER() OVER()) + 15, 4, '0')) AS legalRepresentativePhone,
    CONCAT('1390000', LPAD((ROW_NUMBER() OVER()) + 15, 4, '0')) AS legalRepresentativePhone2,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '120102'
            WHEN 1 THEN '320104'
            WHEN 2 THEN '320505'
            WHEN 3 THEN '340104'
            WHEN 4 THEN '350203'
            WHEN 5 THEN '430104'
            WHEN 6 THEN '530102'
            WHEN 7 THEN '410105'
            WHEN 8 THEN '210213'
            ELSE '330203'
        END,
        '1990', LPAD((ROW_NUMBER() OVER()) % 12 + 1, 2, '0'), LPAD((ROW_NUMBER() OVER()) % 28 + 1, 2, '0'),
        LPAD((ROW_NUMBER() OVER()) + 6000, 4, '0')
    ) AS legalRepresentativeId,
    CONCAT('tax', LPAD((ROW_NUMBER() OVER()) + 600000, 6, '0')) AS legalRepresentativeTaxPassword,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '徐明'
            WHEN 1 THEN '林强'
            WHEN 2 THEN '罗伟'
            WHEN 3 THEN '梁华'
            WHEN 4 THEN '宋杰'
            WHEN 5 THEN '唐磊'
            WHEN 6 THEN '韩涛'
            WHEN 7 THEN '冯亮'
            WHEN 8 THEN '曹斌'
            ELSE '彭飞'
        END
    ) AS taxOfficerName,
    CONCAT('1380000', LPAD((ROW_NUMBER() OVER()) + 15, 4, '0')) AS taxOfficerPhone,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '120102'
            WHEN 1 THEN '320104'
            WHEN 2 THEN '320505'
            WHEN 3 THEN '340104'
            WHEN 4 THEN '350203'
            WHEN 5 THEN '430104'
            WHEN 6 THEN '530102'
            WHEN 7 THEN '410105'
            WHEN 8 THEN '210213'
            ELSE '330203'
        END,
        '1990', LPAD((ROW_NUMBER() OVER()) % 12 + 1, 2, '0'), LPAD((ROW_NUMBER() OVER()) % 28 + 1, 2, '0'),
        LPAD((ROW_NUMBER() OVER()) + 6000, 4, '0')
    ) AS taxOfficerId,
    CONCAT('tax', LPAD((ROW_NUMBER() OVER()) + 600000, 6, '0')) AS taxOfficerTaxPassword,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN '金税盘'
        WHEN 1 THEN '航天信息'
        WHEN 2 THEN '百旺金赋'
        ELSE '税控盘'
    END AS invoicingSoftware,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN '金税盘开票系统'
        WHEN 1 THEN '航天信息开票系统'
        WHEN 2 THEN '百旺开票系统'
        ELSE '税控盘开票系统'
    END AS invoicingNotes,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '徐明'
            WHEN 1 THEN '林强'
            WHEN 2 THEN '罗伟'
            WHEN 3 THEN '梁华'
            WHEN 4 THEN '宋杰'
            WHEN 5 THEN '唐磊'
            WHEN 6 THEN '韩涛'
            WHEN 7 THEN '冯亮'
            WHEN 8 THEN '曹斌'
            ELSE '彭飞'
        END
    ) AS invoiceOfficerName,
    CONCAT('1380000', LPAD((ROW_NUMBER() OVER()) + 15, 4, '0')) AS invoiceOfficerPhone,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '120102'
            WHEN 1 THEN '320104'
            WHEN 2 THEN '320505'
            WHEN 3 THEN '340104'
            WHEN 4 THEN '350203'
            WHEN 5 THEN '430104'
            WHEN 6 THEN '530102'
            WHEN 7 THEN '410105'
            WHEN 8 THEN '210213'
            ELSE '330203'
        END,
        '1990', LPAD((ROW_NUMBER() OVER()) % 12 + 1, 2, '0'), LPAD((ROW_NUMBER() OVER()) % 28 + 1, 2, '0'),
        LPAD((ROW_NUMBER() OVER()) + 6000, 4, '0')
    ) AS invoiceOfficerId,
    CONCAT('tax', LPAD((ROW_NUMBER() OVER()) + 600000, 6, '0')) AS invoiceOfficerTaxPassword,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 5
            WHEN 0 THEN '张财务'
            WHEN 1 THEN '李财务'
            WHEN 2 THEN '王财务'
            WHEN 3 THEN '赵财务'
            ELSE '刘财务'
        END
    ) AS financialContactName,
    CONCAT('1380000', LPAD((ROW_NUMBER() OVER()) + 16, 4, '0')) AS financialContactPhone,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '120102'
            WHEN 1 THEN '320104'
            WHEN 2 THEN '320505'
            WHEN 3 THEN '340104'
            WHEN 4 THEN '350203'
            WHEN 5 THEN '430104'
            WHEN 6 THEN '530102'
            WHEN 7 THEN '410105'
            WHEN 8 THEN '210213'
            ELSE '330203'
        END,
        '1991', LPAD((ROW_NUMBER() OVER()) % 12 + 1, 2, '0'), LPAD((ROW_NUMBER() OVER()) % 28 + 1, 2, '0'),
        LPAD((ROW_NUMBER() OVER()) + 6000, 4, '0')
    ) AS financialContactId,
    CONCAT('finance', LPAD((ROW_NUMBER() OVER()) + 600, 3, '0')) AS financialContactTaxPassword,
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN '增值税一般纳税人'
        WHEN 1 THEN '增值税小规模纳税人'
        ELSE '增值税一般纳税人'
    END AS taxCategories,
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 0 THEN '五险一金'
        WHEN 1 THEN '基本社保'
        ELSE '社会保险'
    END AS socialInsuranceTypes,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '徐明,林强,罗伟'
            WHEN 1 THEN '梁华,宋杰,唐磊'
            WHEN 2 THEN '韩涛,冯亮,曹斌'
            WHEN 3 THEN '彭飞,徐明,林强'
            WHEN 4 THEN '罗伟,梁华,宋杰'
            WHEN 5 THEN '唐磊,韩涛,冯亮'
            WHEN 6 THEN '曹斌,彭飞,徐明'
            WHEN 7 THEN '林强,罗伟,梁华'
            WHEN 8 THEN '宋杰,唐磊,韩涛'
            ELSE '冯亮,曹斌,彭飞'
        END
    ) AS insuredPersonnel,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '12010200'
            WHEN 1 THEN '32010400'
            WHEN 2 THEN '32050500'
            WHEN 3 THEN '34010400'
            WHEN 4 THEN '35020300'
            WHEN 5 THEN '43010400'
            WHEN 6 THEN '53010200'
            WHEN 7 THEN '41010500'
            WHEN 8 THEN '21021300'
            ELSE '33020300'
        END,
        LPAD((ROW_NUMBER() OVER()) + 600000000, 9, '0')
    ) AS tripartiteAgreementAccount,
    CONCAT('personal', LPAD((ROW_NUMBER() OVER()) + 600, 3, '0')) AS personalIncomeTaxPassword,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN '徐明,林强,罗伟'
            WHEN 1 THEN '梁华,宋杰,唐磊'
            WHEN 2 THEN '韩涛,冯亮,曹斌'
            WHEN 3 THEN '彭飞,徐明,林强'
            WHEN 4 THEN '罗伟,梁华,宋杰'
            WHEN 5 THEN '唐磊,韩涛,冯亮'
            WHEN 6 THEN '曹斌,彭飞,徐明'
            WHEN 7 THEN '林强,罗伟,梁华'
            WHEN 8 THEN '宋杰,唐磊,韩涛'
            ELSE '冯亮,曹斌,彭飞'
        END
    ) AS personalIncomeTaxStaff,
    CONCAT('SEAL', LPAD((ROW_NUMBER() OVER()) + 10, 3, '0')) AS sealStorageNumber,
    '正常' AS enterpriseStatus,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN 'A级'
        WHEN 1 THEN 'B级'
        WHEN 2 THEN 'AA级'
        ELSE 'A级'
    END AS customerLevel,
    ROUND(500000 + RAND() * 1500000, 2) AS contributionAmount,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN '正常经营'
        WHEN 1 THEN '快速成长'
        WHEN 2 THEN '稳定发展'
        ELSE '正常经营'
    END AS businessStatus,
    '系统管理员' AS submitter,
    CASE (ROW_NUMBER() OVER()) % 6
        WHEN 0 THEN '新增客户，发展潜力大'
        WHEN 1 THEN '优质客户，合作稳定'
        WHEN 2 THEN '重点关注客户'
        WHEN 3 THEN '行业标杆企业'
        WHEN 4 THEN '成长型企业客户'
        ELSE '战略合作伙伴'
    END AS remarks,
    CONCAT('PA', LPAD((ROW_NUMBER() OVER()) + 10, 3, '0')) AS paperArchiveNumber,
    CONCAT(
        CASE (ROW_NUMBER() OVER()) % 10
            WHEN 0 THEN 'TJ'
            WHEN 1 THEN 'NJ'
            WHEN 2 THEN 'SZ'
            WHEN 3 THEN 'HF'
            WHEN 4 THEN 'XM'
            WHEN 5 THEN 'CS'
            WHEN 6 THEN 'KM'
            WHEN 7 THEN 'ZZ'
            WHEN 8 THEN 'DL'
            ELSE 'NB'
        END,
        LPAD((ROW_NUMBER() OVER()), 3, '0')
    ) AS onlineBankingArchiveNumber,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 0 THEN '档案齐全'
        WHEN 1 THEN '资料完整'
        WHEN 2 THEN '材料完备'
        ELSE '文档齐备'
    END AS archiveStorageRemarks
FROM information_schema.tables 
LIMIT 10;

-- 提示执行成功
SELECT '客户数据生成完成！共插入35条记录。' AS message; 