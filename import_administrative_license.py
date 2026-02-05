#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
行政许可数据导入脚本
从 Excel 文件导入行政许可数据到 sys_customer 表
"""

import os
import sys
import json
import pandas as pd
import pymysql
from datetime import datetime
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USERNAME', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_DATABASE', 'zhongyue_nodejs'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# Excel 文件路径
EXCEL_FILE = '行政许可有效期.xlsx'

def connect_db():
    """连接数据库"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        print(f"✅ 成功连接到数据库: {DB_CONFIG['database']}")
        return connection
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        sys.exit(1)

def parse_date(date_value):
    """解析日期字段"""
    if pd.isna(date_value) or date_value == '' or date_value is None:
        return None
    
    # 如果已经是 datetime 对象
    if isinstance(date_value, datetime):
        return date_value.strftime('%Y-%m-%d')
    
    # 如果是字符串，尝试解析
    if isinstance(date_value, str):
        try:
            # 尝试多种日期格式
            for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%Y年%m月%d日']:
                try:
                    return datetime.strptime(date_value, fmt).strftime('%Y-%m-%d')
                except:
                    continue
        except:
            pass
    
    return None

def parse_phone(phone_value):
    """解析电话号码"""
    if pd.isna(phone_value) or phone_value == '':
        return ''
    return str(phone_value).strip()

def parse_amount(amount_value):
    """解析金额 - 保持原始字符串格式，因为可能包含描述性文字"""
    if pd.isna(amount_value) or amount_value == '':
        return ''
    # 转换为字符串并去除首尾空格
    return str(amount_value).strip()

def read_excel_data():
    """读取 Excel 文件"""
    try:
        if not os.path.exists(EXCEL_FILE):
            print(f"❌ 文件不存在: {EXCEL_FILE}")
            sys.exit(1)
        
        df = pd.read_excel(EXCEL_FILE)
        print(f"✅ 成功读取 Excel 文件，共 {len(df)} 行数据")
        print(f"📋 表头: {list(df.columns)}")
        return df
    except Exception as e:
        print(f"❌ 读取 Excel 文件失败: {e}")
        sys.exit(1)

def get_customer_by_name(cursor, company_name):
    """根据企业名称查询客户"""
    sql = "SELECT id, companyName, actualResponsibles, administrativeLicense FROM sys_customer WHERE companyName = %s"
    cursor.execute(sql, (company_name,))
    return cursor.fetchone()

def create_new_customer(cursor, company_name, actual_responsible, administrative_license):
    """创建新客户"""
    sql = """
    INSERT INTO sys_customer (
        companyName, 
        actualResponsibles, 
        administrativeLicense,
        createTime,
        updateTime
    ) VALUES (%s, %s, %s, NOW(), NOW())
    """
    
    actual_responsibles_json = json.dumps([actual_responsible], ensure_ascii=False) if actual_responsible['name'] or actual_responsible['phone'] else None
    administrative_license_json = json.dumps([administrative_license], ensure_ascii=False)
    
    cursor.execute(sql, (
        company_name,
        actual_responsibles_json,
        administrative_license_json
    ))
    return cursor.lastrowid

def update_customer(cursor, customer_id, actual_responsible, administrative_license, existing_responsibles, existing_licenses):
    """更新现有客户"""
    # 解析现有数据
    responsibles_list = []
    if existing_responsibles:
        try:
            responsibles_list = json.loads(existing_responsibles) if isinstance(existing_responsibles, str) else existing_responsibles
            if not isinstance(responsibles_list, list):
                responsibles_list = []
        except:
            responsibles_list = []
    
    licenses_list = []
    if existing_licenses:
        try:
            licenses_list = json.loads(existing_licenses) if isinstance(existing_licenses, str) else existing_licenses
            if not isinstance(licenses_list, list):
                licenses_list = []
        except:
            licenses_list = []
    
    # 添加新的实际负责人（如果有姓名或电话）
    if actual_responsible['name'] or actual_responsible['phone']:
        # 检查是否已存在相同的负责人
        exists = False
        for resp in responsibles_list:
            if resp.get('name') == actual_responsible['name'] and resp.get('phone') == actual_responsible['phone']:
                exists = True
                break
        
        if not exists:
            responsibles_list.append(actual_responsible)
    
    # 添加新的行政许可
    licenses_list.append(administrative_license)
    
    # 更新数据库
    sql = """
    UPDATE sys_customer 
    SET actualResponsibles = %s, 
        administrativeLicense = %s,
        updateTime = NOW()
    WHERE id = %s
    """
    
    responsibles_json = json.dumps(responsibles_list, ensure_ascii=False) if responsibles_list else None
    licenses_json = json.dumps(licenses_list, ensure_ascii=False)
    
    cursor.execute(sql, (responsibles_json, licenses_json, customer_id))

def import_data():
    """导入数据主函数"""
    # 读取 Excel 数据
    df = read_excel_data()
    
    # 连接数据库
    connection = connect_db()
    
    try:
        cursor = connection.cursor()
        
        # 统计信息
        created_companies = []
        updated_companies = []
        error_records = []
        
        print("\n" + "="*60)
        print("开始导入数据...")
        print("="*60 + "\n")
        
        for index, row in df.iterrows():
            try:
                # 提取数据
                company_name = str(row.get('企业名称', '')).strip()
                contact_name = str(row.get('企业联系人姓名', '')).strip() if not pd.isna(row.get('企业联系人姓名')) else ''
                contact_phone = parse_phone(row.get('联系电话', ''))
                license_type = str(row.get('行政许可类型', '')).strip() if not pd.isna(row.get('行政许可类型')) else ''
                last_charge_amount = parse_amount(row.get('上次收费金额', ''))
                start_date = parse_date(row.get('行政许可开始日期', ''))
                expiry_date = parse_date(row.get('行政许可到期日期', ''))
                remarks = str(row.get('备注', '')).strip() if not pd.isna(row.get('备注')) else ''
                
                # 验证必填字段
                if not company_name:
                    error_records.append(f"第 {index + 2} 行: 企业名称为空")
                    continue
                
                if not license_type:
                    error_records.append(f"第 {index + 2} 行 ({company_name}): 行政许可类型为空")
                    continue
                
                # 构建实际负责人对象
                actual_responsible = {
                    'name': contact_name,
                    'phone': contact_phone
                }
                
                # 构建行政许可对象
                administrative_license = {
                    'licenseType': license_type,
                    'startDate': start_date,
                    'expiryDate': expiry_date,
                    'images': {},
                    'lastChargeAmount': last_charge_amount if last_charge_amount else None,
                    'remarks': remarks if remarks else None
                }
                
                # 查询客户是否存在
                customer = get_customer_by_name(cursor, company_name)
                
                if customer:
                    # 更新现有客户
                    update_customer(
                        cursor,
                        customer['id'],
                        actual_responsible,
                        administrative_license,
                        customer.get('actualResponsibles'),
                        customer.get('administrativeLicense')
                    )
                    updated_companies.append(company_name)
                    print(f"✏️  更新: {company_name} - {license_type}")
                else:
                    # 创建新客户
                    new_id = create_new_customer(
                        cursor,
                        company_name,
                        actual_responsible,
                        administrative_license
                    )
                    created_companies.append(company_name)
                    print(f"➕ 新建: {company_name} (ID: {new_id}) - {license_type}")
                
            except Exception as e:
                error_msg = f"第 {index + 2} 行 ({company_name if 'company_name' in locals() else '未知'}): {str(e)}"
                error_records.append(error_msg)
                print(f"❌ {error_msg}")
        
        # 提交事务
        connection.commit()
        
        # 打印统计信息
        print("\n" + "="*60)
        print("导入完成！")
        print("="*60)
        print(f"\n📊 统计信息:")
        print(f"  - 总记录数: {len(df)}")
        print(f"  - 新建企业: {len(created_companies)}")
        print(f"  - 更新企业: {len(updated_companies)}")
        print(f"  - 错误记录: {len(error_records)}")
        
        if created_companies:
            print(f"\n🆕 新建的企业 ({len(created_companies)}):")
            for i, company in enumerate(created_companies, 1):
                print(f"  {i}. {company}")
        
        if error_records:
            print(f"\n⚠️  错误记录 ({len(error_records)}):")
            for error in error_records:
                print(f"  - {error}")
        
        print("\n✅ 数据导入成功！\n")
        
    except Exception as e:
        connection.rollback()
        print(f"\n❌ 导入失败，已回滚: {e}\n")
        raise
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    print("\n" + "="*60)
    print("行政许可数据导入工具")
    print("="*60 + "\n")
    
    import_data()
