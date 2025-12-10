#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
做账所需资料迁移脚本
将旧的 accountingRequiredFiles 数据（没有分类信息）迁移到新格式（包含 categoryId 和 categoryPath）
"""

import json
import os
from dotenv import load_dotenv
from datetime import datetime

# 从 .env 文件加载配置
load_dotenv()

# 数据库配置
DB_CONFIG = {
    'host': "localhost",
    'user': os.getenv('DB_USERNAME', 'root'),
    'password': os.getenv('DB_PASSWORD', 'zhongyue123'),
    'database': os.getenv('DB_DATABASE', 'zhongyue_nodejs'),
    'port': int(os.getenv('DB_PORT', 3306)),
}

# 尝试导入 mysql.connector，如果失败则使用 pymysql
try:
    import mysql.connector
    from mysql.connector import Error
    USE_MYSQL_CONNECTOR = True
except ImportError:
    try:
        import pymysql
        USE_MYSQL_CONNECTOR = False
    except ImportError:
        print("错误: 需要安装 mysql-connector-python 或 pymysql")
        print("请运行: pip3 install mysql-connector-python")
        exit(1)

def get_db_connection():
    """获取数据库连接"""
    try:
        if USE_MYSQL_CONNECTOR:
            conn = mysql.connector.connect(**DB_CONFIG)
        else:
            conn = pymysql.connect(
                host=DB_CONFIG['host'],
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                database=DB_CONFIG['database'],
                port=DB_CONFIG['port'],
                charset='utf8mb4'
            )
        return conn
    except Exception as e:
        print(f"数据库连接失败: {e}")
        print(f"配置: {DB_CONFIG}")
        return None

def create_uncategorized_category(conn, customer_id):
    """为客户创建"未分类"分类"""
    cursor = conn.cursor()
    try:
        # 检查是否已存在
        cursor.execute(
            "SELECT id FROM accounting_file_category WHERE customerId = %s AND categoryName = '未分类'",
            (customer_id,)
        )
        result = cursor.fetchone()
        
        if result:
            return result[0]
        
        # 创建新的"未分类"分类
        cursor.execute(
            """INSERT INTO accounting_file_category 
               (customerId, categoryName, categoryPath, parentId, createdAt, updatedAt)
               VALUES (%s, '未分类', '未分类', NULL, NOW(), NOW())""",
            (customer_id,)
        )
        conn.commit()
        return cursor.lastrowid
    except Error as e:
        print(f"创建分类失败: {e}")
        return None
    finally:
        cursor.close()

def migrate_customer_files(conn, customer_id, old_files, category_id):
    """迁移单个客户的文件"""
    cursor = conn.cursor()
    try:
        # 为每个文件添加 categoryId 和 categoryPath
        new_files = []
        for file in old_files:
            new_file = {
                'fileName': file.get('fileName'),
                'url': file.get('url'),
                'uploadTime': file.get('uploadTime'),
                'categoryId': category_id,
                'categoryPath': '未分类'
            }
            new_files.append(new_file)
        
        # 更新数据库
        new_files_json = json.dumps(new_files, ensure_ascii=False)
        cursor.execute(
            "UPDATE sys_customer SET accountingRequiredFiles = %s WHERE id = %s",
            (new_files_json, customer_id)
        )
        conn.commit()
        return True
    except Error as e:
        print(f"迁移文件失败 (客户ID: {customer_id}): {e}")
        return False
    finally:
        cursor.close()

def main():
    """主函数"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # 获取所有有做账所需资料的客户
        cursor.execute(
            """SELECT id, companyName, accountingRequiredFiles 
               FROM sys_customer 
               WHERE accountingRequiredFiles IS NOT NULL 
               AND JSON_LENGTH(accountingRequiredFiles) > 0"""
        )
        
        customers = cursor.fetchall()
        cursor.close()
        
        print(f"找到 {len(customers)} 个需要迁移的客户")
        
        success_count = 0
        fail_count = 0
        
        for customer_id, company_name, files_json in customers:
            print(f"\n处理客户: {company_name} (ID: {customer_id})")
            
            try:
                # 解析 JSON
                files = json.loads(files_json) if isinstance(files_json, str) else files_json
                
                if not isinstance(files, list):
                    print(f"  ⚠️  文件格式不正确，跳过")
                    fail_count += 1
                    continue
                
                # 创建"未分类"分类
                category_id = create_uncategorized_category(conn, customer_id)
                if not category_id:
                    print(f"  ❌ 创建分类失败")
                    fail_count += 1
                    continue
                
                # 迁移文件
                if migrate_customer_files(conn, customer_id, files, category_id):
                    print(f"  ✅ 迁移成功 ({len(files)} 个文件)")
                    success_count += 1
                else:
                    print(f"  ❌ 迁移失败")
                    fail_count += 1
            
            except json.JSONDecodeError as e:
                print(f"  ❌ JSON 解析失败: {e}")
                fail_count += 1
            except Exception as e:
                print(f"  ❌ 处理失败: {e}")
                fail_count += 1
        
        print(f"\n\n========== 迁移完成 ==========")
        print(f"成功: {success_count}")
        print(f"失败: {fail_count}")
        print(f"总计: {len(customers)}")
        
        # 验证迁移结果
        print(f"\n========== 验证迁移结果 ==========")
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id, companyName, JSON_LENGTH(accountingRequiredFiles) as fileCount
               FROM sys_customer 
               WHERE accountingRequiredFiles IS NOT NULL 
               AND JSON_LENGTH(accountingRequiredFiles) > 0
               LIMIT 5"""
        )
        
        results = cursor.fetchall()
        for customer_id, company_name, file_count in results:
            print(f"客户: {company_name} (ID: {customer_id}), 文件数: {file_count}")
        
        cursor.close()
    
    finally:
        conn.close()

if __name__ == '__main__':
    main()
