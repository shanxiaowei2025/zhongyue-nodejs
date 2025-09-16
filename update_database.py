#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import pymysql
import os
from dotenv import load_dotenv
from datetime import datetime

# 尝试加载.env文件中的环境变量（如果存在）
load_dotenv()

# 从环境变量获取数据库连接信息，如果不存在则使用默认值
#DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_HOST = 'localhost'
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USERNAME = os.getenv('DB_USERNAME', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'root')
DB_DATABASE = os.getenv('DB_DATABASE', 'zhongyue')

# 打印数据库连接信息
print("数据库连接信息:")
print(f"主机: {DB_HOST}")
print(f"端口: {DB_PORT}")
print(f"用户名: {DB_USERNAME}")
print(f"密码: {'*' * len(DB_PASSWORD)}")  # 不直接打印密码，用*代替
print(f"数据库: {DB_DATABASE}")

# 连接数据库
try:
    connection = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USERNAME,
        password=DB_PASSWORD,
        database=DB_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    print("数据库连接成功!")
except Exception as e:
    print(f"数据库连接失败: {e}")
    exit(1)

# 处理日期格式的函数
def format_date(date_str):
    if not date_str:
        return None
    
    # 尝试多种日期格式
    date_formats = [
        '%Y-%m-%d %H:%M:%S',  # 年-月-日 时:分:秒
        '%Y-%m-%d',      # 年-月-日
        '%d/%m/%Y %H:%M:%S',  # 日/月/年 时:分:秒
        '%d/%m/%Y',      # 日/月/年
        '%Y/%m/%d',      # 年/月/日
    ]
    
    for date_format in date_formats:
        try:
            date_obj = datetime.strptime(date_str, date_format)
            if '%H:%M:%S' in date_format:
                # 如果原格式包含时间，则返回完整的日期时间
                return date_obj.strftime('%Y-%m-%d %H:%M:%S')
            else:
                # 否则只返回日期部分
                return date_obj.strftime('%Y-%m-%d')
        except ValueError:
            continue
    
    # 所有尝试都失败，返回原始字符串
    print(f"无法解析日期: {date_str}")
    return None

# 读取JSON文件
try:
    with open('NEW.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
        print(f"成功读取JSON文件，共有{len(data)}条记录")
except Exception as e:
    print(f"读取JSON文件失败: {e}")
    exit(1)

# 更新数据库
cursor = connection.cursor()
updated_records = []
update_count = 0
error_count = 0
skipped_count = 0

try:
    for item in data:
        # 从JSON数据中获取对应字段
        company_name = item.get('company_name')
        fee_total = item.get('fee_total')
        administrative_licensing_fee = item.get('administrative_licensing_fee')
        create_time = item.get('create_time')
        
        # 如果administrative_licensing_fee或create_time为空，则继续下一条记录
        if administrative_licensing_fee is None:
            skipped_count += 1
            continue
            
        if create_time is None:
            print(f"跳过缺少create_time的记录 - 公司: {company_name}")
            skipped_count += 1
            continue
            
        # 格式化日期
        formatted_date = format_date(create_time)
        if not formatted_date:
            print(f"跳过日期格式无效的记录 - 公司: {company_name}, 日期: {create_time}")
            skipped_count += 1
            continue
        
        # 更新数据库记录
        update_query = """
        UPDATE sys_expense
        SET administrativeLicenseFee = %s
        WHERE companyName = %s AND totalFee = %s AND createdAt = %s
        """
        
        try:
            # 执行更新
            cursor.execute(update_query, (administrative_licensing_fee, company_name, fee_total, formatted_date))
            
            # 如果有记录被更新
            if cursor.rowcount > 0:
                update_count += 1
                # 保存更新的记录信息
                updated_records.append({
                    'companyName': company_name,
                    'totalFee': fee_total,
                    'administrativeLicenseFee': administrative_licensing_fee,
                    'createdAt': formatted_date
                })
            else:
                # 尝试只用日期部分匹配
                if ' ' in formatted_date:
                    date_only = formatted_date.split(' ')[0]
                    fallback_query = """
                    UPDATE sys_expense
                    SET administrativeLicenseFee = %s
                    WHERE companyName = %s AND totalFee = %s AND DATE(createdAt) = %s
                    """
                    cursor.execute(fallback_query, (administrative_licensing_fee, company_name, fee_total, date_only))
                    
                    if cursor.rowcount > 0:
                        update_count += 1
                        updated_records.append({
                            'companyName': company_name,
                            'totalFee': fee_total,
                            'administrativeLicenseFee': administrative_licensing_fee,
                            'createdAt': date_only + ' (日期匹配)'
                        })
                    else:
                        print(f"未找到匹配记录 - 公司: {company_name}, 总费用: {fee_total}, 创建日期: {formatted_date}")
                else:
                    print(f"未找到匹配记录 - 公司: {company_name}, 总费用: {fee_total}, 创建日期: {formatted_date}")
        except Exception as e:
            error_count += 1
            print(f"更新记录失败: {e} - 公司: {company_name}")
    
    # 提交事务
    connection.commit()
    print(f"更新完成! 更新记录数: {update_count}, 错误记录数: {error_count}, 跳过记录数: {skipped_count}")
    
    # 打印已更新的记录详情
    if updated_records:
        print("\n已更新的记录:")
        for i, record in enumerate(updated_records, 1):
            print(f"{i}. 公司: {record['companyName']}, 总费用: {record['totalFee']}, 行政许可费: {record['administrativeLicenseFee']}, 创建日期: {record['createdAt']}")
    
except Exception as e:
    connection.rollback()
    print(f"执行更新时出错: {e}")
    exit(1)
finally:
    # 关闭连接
    connection.close()
