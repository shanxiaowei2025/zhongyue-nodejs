#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd # type: ignore
from sqlalchemy import create_engine, text # type: ignore
import numpy as np # type: ignore
import os
from datetime import datetime
import argparse
import sys
import traceback
import json
import urllib.parse

# 设置调试模式
DEBUG = True

def debug_print(message):
    """打印调试信息"""
    if DEBUG:
        print(f"DEBUG: {message}")

def update_excel_data(file_path):
    try:
        debug_print("开始批量更新Excel数据函数")
        debug_print(f"Python版本: {sys.version}")
        debug_print(f"当前工作目录: {os.getcwd()}")
        debug_print(f"命令行参数: {sys.argv}")
        
        # 配置数据库连接
        # 从环境变量获取数据库连接信息
        DB_HOST = os.environ.get('DB_HOST', '')
        DB_PORT = os.environ.get('DB_PORT', '')
        DB_NAME = os.environ.get('DB_DATABASE', '')
        DB_USER = os.environ.get('DB_USERNAME', '')
        # 对密码进行 URL 编码，防止特殊字符（如 @）导致连接失败
        DB_PASS = urllib.parse.quote_plus(os.environ.get('DB_PASSWORD', ''))

        # 输出数据库连接信息（不包含密码）
        debug_print(f"数据库连接信息: Host={DB_HOST}, Port={DB_PORT}, Name={DB_NAME}, User={DB_USER}")

        # 检查环境变量
        for key, value in os.environ.items():
            if key.startswith('DB_'):
                debug_print(f"环境变量 {key}={'*****' if 'PASSWORD' in key else value}")

        # 验证数据库配置
        if not DB_NAME or not DB_USER or not DB_PASS:
            error_msg = "错误: 缺少数据库连接信息，请检查环境变量配置"
            print(error_msg)
            error_info = {
                "success": False,
                "error_type": "database_connection",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        try:
            # 创建数据库连接
            connection_string = f'mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
            print(f"尝试连接数据库...")
            debug_print(f"连接字符串(不含密码): mysql+pymysql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
            engine = create_engine(connection_string)
            
            # 测试连接
            with engine.connect() as conn:
                print(f"数据库连接成功")
        except Exception as e:
            error_msg = f"数据库连接失败: {str(e)}"
            print(error_msg)
            print(f"连接字符串(不含密码): mysql+pymysql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
            traceback.print_exc()
            error_info = {
                "success": False,
                "error_type": "database_connection",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        # 读取输入文件
        print(f"开始读取文件: {file_path}")
        debug_print(f"尝试读取文件: {file_path}")
        debug_print(f"文件是否存在: {os.path.exists(file_path)}")
        debug_print(f"文件大小: {os.path.getsize(file_path) if os.path.exists(file_path) else '文件不存在'}")

        # 检查文件是否存在
        if not os.path.exists(file_path):
            error_msg = f"错误: 文件 {file_path} 不存在"
            print(error_msg)
            error_info = {
                "success": False,
                "error_type": "file_not_found",
                "error_message": error_msg,
                "failed_records": []
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False

        try:
            # 根据文件扩展名选择不同的读取方式
            file_ext = os.path.splitext(file_path)[1].lower()
            print(f"文件扩展名: {file_ext}")
            
            if file_ext == '.csv':
                # 读取CSV文件
                print(f"检测到CSV文件，使用pandas.read_csv读取")
                df = pd.read_csv(file_path, encoding='utf-8')
                # 尝试不同的编码方式（如果UTF-8失败）
                if df.empty or len(df.columns) == 0:
                    print("尝试使用GBK编码读取CSV文件")
                    df = pd.read_csv(file_path, encoding='gbk')
            else:
                # 读取Excel文件
                print(f"检测到Excel文件，使用pandas.read_excel读取")
                df = pd.read_excel(file_path, engine='openpyxl')
            
            print(f"成功读取文件，包含 {len(df)} 行数据")
            
            # 显示前几行数据以检查
            print("数据预览:")
            print(df.head())
            
            # 获取列名
            debug_print("文件列名: " + ", ".join(df.columns.tolist()))
            
            # 根据实体定义创建完整的映射关系
            column_mapping = {
                '企业名称': 'companyName',
                '归属地': 'location',
                '顾问会计': 'consultantAccountant',
                '记账会计': 'bookkeepingAccountant',
                '开票员': 'invoiceOfficer',
                '企业类型': 'enterpriseType',
                '统一社会信用代码': 'unifiedSocialCreditCode',
                '税号': 'taxNumber',
                '注册地址': 'registeredAddress',
                '实际经营地址': 'businessAddress',
                '所属分局': 'taxBureau',
                '实际负责人(备注)': 'actualResponsibleRemark',
                '同宗企业': 'affiliatedEnterprises',
                '老板画像': 'bossProfile',
                '企业画像': 'enterpriseProfile',
                '行业大类': 'industryCategory',
                '行业细分': 'industrySubcategory',
                '是否有税收优惠': 'hasTaxBenefits',
                '工商公示密码': 'businessPublicationPassword',
                '成立日期': 'establishmentDate',
                '营业执照期限': 'licenseExpiryDate',
                '注册资金': 'registeredCapital',
                '认缴到期日期': 'capitalContributionDeadline',
                '认缴到期日期2': 'capitalContributionDeadline2',
                '对公开户行': 'publicBank',
                '开户行账号': 'bankAccountNumber',
                '基本存款账户编号': 'basicDepositAccountNumber',
                '一般户开户行': 'generalAccountBank',
                '一般户账号': 'generalAccountNumber',
                '一般户开户时间': 'generalAccountOpeningDate',
                '对公开户时间': 'publicBankOpeningDate',
                '网银托管档案号': 'onlineBankingArchiveNumber',
                '报税登录方式': 'taxReportLoginMethod',
                '法人姓名': 'legalRepresentativeName',
                '法人电话': 'legalRepresentativePhone',
                '法人电话2': 'legalRepresentativePhone2',
                '法人身份证号': 'legalRepresentativeId',
                '法人税务密码': 'legalRepresentativeTaxPassword',
                '办税员': 'taxOfficerName',
                '办税员电话': 'taxOfficerPhone',
                '办税员身份证号': 'taxOfficerId',
                '办税员税务密码': 'taxOfficerTaxPassword',
                '开票软件': 'invoicingSoftware',
                '开票注意事项': 'invoicingNotes',
                '开票员姓名': 'invoiceOfficerName',
                '开票员电话': 'invoiceOfficerPhone',
                '开票员身份证号': 'invoiceOfficerId',
                '开票员税务密码': 'invoiceOfficerTaxPassword',
                '财务负责人': 'financialContactName',
                '财务负责人电话': 'financialContactPhone',
                '财务负责人身份证号': 'financialContactId',
                '财务负责人税务密码': 'financialContactTaxPassword',
                '税种': 'taxCategories',
                '社保险种': 'socialInsuranceTypes',
                '参保人员': 'insuredPersonnel',
                '三方协议扣款账户': 'tripartiteAgreementAccount',
                '个税密码': 'personalIncomeTaxPassword',
                '个税申报人员': 'personalIncomeTaxStaff',
                '纸质资料档案编号': 'paperArchiveNumber',
                '网银托管存放编号': 'onlineBankingStorageNumber',
                '档案存放备注': 'archiveStorageRemarks',
                '章存放编号': 'sealStorageNumber',
                '企业状态': 'enterpriseStatus',
                '客户分级': 'customerLevel',
                '业务状态': 'businessStatus',
                '备注信息': 'remarks'
            }
            
            # 创建一个新的DataFrame用于更新数据库
            db_data = pd.DataFrame()
            
            # 遍历映射关系，将Excel数据映射到数据库字段
            for excel_col, db_col in column_mapping.items():
                if excel_col in df.columns:
                    db_data[db_col] = df[excel_col]
                    debug_print(f"映射列: {excel_col} -> {db_col}")
                else:
                    debug_print(f"警告: 文件中未找到列 '{excel_col}'")
                    db_data[db_col] = None
            
            # 验证统一社会信用代码是否存在
            validation_errors = []
            valid_records = []
            
            # 定义日期字段列表
            date_fields = [
                'establishmentDate', 'licenseExpiryDate', 
                'capitalContributionDeadline', 'capitalContributionDeadline2',
                'generalAccountOpeningDate', 'publicBankOpeningDate'
            ]
            
            # 检查每条记录
            for index, row in db_data.iterrows():
                row_errors = []
                
                # 检查统一社会信用代码是否为空（更新必须有此字段）
                if pd.isna(row.get('unifiedSocialCreditCode')) or not row.get('unifiedSocialCreditCode'):
                    row_errors.append("统一社会信用代码不能为空")
                
                # 收集此行的所有错误
                if row_errors:
                    validation_errors.append({
                        'index': index,
                        'row': index + 2,  # 文件行号从1开始，且有标题行
                        'companyName': row.get('companyName', '未知企业'),
                        'unifiedSocialCreditCode': row.get('unifiedSocialCreditCode', ''),
                        'errors': row_errors,
                        'reason': '数据验证失败: ' + '; '.join(row_errors)
                    })
                else:
                    # 只添加没有错误的记录
                    valid_records.append(row)
            
            # 将有效记录转换为DataFrame
            if valid_records:
                db_data = pd.DataFrame(valid_records)
            else:
                db_data = pd.DataFrame()
            
            # 处理日期字段 - 只对有效记录进行处理
            if not db_data.empty:
                # 处理日期字段
                for field in date_fields:
                    if field in db_data:
                        # 确保日期格式正确
                        if db_data[field].dtype != 'datetime64[ns]':
                            try:
                                db_data[field] = pd.to_datetime(db_data[field], errors='coerce')
                            except:
                                debug_print(f"警告: 无法将 {field} 转换为日期格式，设置为NULL")
            
            # 替换NaN为None(NULL)
            if not db_data.empty:
                db_data = db_data.replace({np.nan: None})
            
            # 查询数据库中存在的统一社会信用代码
            existing_codes_map = {}
            not_found_records = []
            
            if not db_data.empty:
                # 获取所有统一社会信用代码
                codes_to_check = [
                    code for code in db_data['unifiedSocialCreditCode'].tolist() 
                    if code is not None
                ]
                
                # 检查这些代码是否存在于数据库中
                if codes_to_check:
                    code_list_str = ', '.join([f"'{code}'" for code in codes_to_check])
                    query = f"SELECT id, unifiedSocialCreditCode FROM sys_customer WHERE unifiedSocialCreditCode IN ({code_list_str})"
                    
                    with engine.connect() as conn:
                        result = conn.execute(text(query))
                        for row in result:
                            existing_codes_map[row[1]] = row[0]  # 存储代码和对应的ID
            
            debug_print(f"数据库中找到 {len(existing_codes_map)} 个匹配的统一社会信用代码记录")
            
            # 检查环境变量，如果不存在的记录是否创建新客户
            create_if_not_exists = os.environ.get('CREATE_IF_NOT_EXISTS', '').lower() == 'true'
            debug_print(f"如果记录不存在则创建新客户: {create_if_not_exists}")

            # 筛选出存在和不存在的记录
            records_to_update = []
            records_to_create = []
            
            if not db_data.empty:
                for index, row in db_data.iterrows():
                    code = row.get('unifiedSocialCreditCode')
                    # 检查统一社会信用代码是否存在于数据库中
                    if code in existing_codes_map:
                        # 添加数据库记录ID到行数据中
                        row_dict = row.to_dict()
                        row_dict['id'] = existing_codes_map[code]
                        records_to_update.append(row_dict)
                    else:
                        # 如果启用了创建新记录功能
                        if create_if_not_exists:
                            # 将不存在的记录标记为需要创建
                            records_to_create.append(row.to_dict())
                        else:
                            not_found_records.append({
                                'index': index,
                                'row': index + 2,  # 文件行号从1开始，且有标题行
                                'companyName': row.get('companyName', '未知企业'),
                                'unifiedSocialCreditCode': code,
                                'reason': '统一社会信用代码在数据库中不存在'
                            })
            
            # 输出待更新和未找到的记录信息
            print(f"找到 {len(records_to_update)} 条可更新记录")
            print(f"有 {len(not_found_records)} 条记录在数据库中未找到")
            if create_if_not_exists:
                print(f"将为 {len(records_to_create)} 条记录创建新客户")
            
            # 所有错误记录
            failed_records = validation_errors + not_found_records
            
            # 更新数据库
            success = True
            error_message = ""
            updated_count = 0
            created_count = 0

            if not records_to_update:
                print("没有可更新的记录")
            else:
                try:
                    # 添加更新时间
                    current_time = datetime.now()
                    
                    # 逐条更新记录
                    with engine.connect() as conn:
                        for record in records_to_update:
                            record_id = record.pop('id')  # 提取ID并从字典中移除
                            
                            # 排除为None的字段（保持数据库中原有值）
                            update_fields = {k: v for k, v in record.items() if v is not None}
                            
                            # 添加更新时间
                            update_fields['updateTime'] = current_time
                            
                            if not update_fields:  # 如果没有需要更新的字段，跳过此记录
                                continue
                                
                            # 构建SET子句
                            set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
                            
                            # 构建更新SQL
                            update_sql = f"UPDATE sys_customer SET {set_clause} WHERE id = :id"
                            
                            # 添加ID到参数中
                            params = {**update_fields, 'id': record_id}
                            
                            # 执行更新
                            try:
                                conn.execute(text(update_sql), params)
                                updated_count += 1
                            except Exception as e:
                                print(f"更新记录ID={record_id}时出错: {str(e)}")
                                failed_records.append({
                                    'id': record_id,
                                    'unifiedSocialCreditCode': record.get('unifiedSocialCreditCode', ''),
                                    'reason': f"更新失败: {str(e)}"
                                })
                        
                        # 提交事务
                        conn.commit()
                    
                    print(f"成功更新 {updated_count} 条记录!")
                    
                    # 为更新的客户创建服务历程记录
                    if updated_count > 0:
                        print("开始创建服务历程记录...")
                        
                        try:
                            with engine.connect() as conn:
                                # 逐一处理每条更新记录
                                for record in records_to_update:
                                    # 提取需要的字段
                                    service_history_fields = {
                                        'companyName': record.get('companyName'),
                                        'unifiedSocialCreditCode': record.get('unifiedSocialCreditCode'),
                                        'consultantAccountant': record.get('consultantAccountant'),
                                        'bookkeepingAccountant': record.get('bookkeepingAccountant'),
                                        'invoiceOfficer': record.get('invoiceOfficer'),
                                        'enterpriseStatus': record.get('enterpriseStatus'),
                                        'businessStatus': record.get('businessStatus'),
                                        'createdAt': current_time,
                                        'updatedAt': current_time
                                    }
                                    
                                    # 移除None值
                                    service_history_fields = {k: v for k, v in service_history_fields.items() if v is not None}
                                    
                                    # 检查是否有关键字段发生变化
                                    has_key_field = any(key in service_history_fields for key in [
                                        'consultantAccountant', 'bookkeepingAccountant', 
                                        'invoiceOfficer', 'enterpriseStatus', 'businessStatus'
                                    ])
                                    
                                    # 只有在包含必要字段且有关键字段更新时才创建记录
                                    if ('companyName' in service_history_fields or 'unifiedSocialCreditCode' in service_history_fields) and has_key_field:
                                        # 构建INSERT SQL
                                        fields = ', '.join(service_history_fields.keys())
                                        placeholders = ', '.join([f":{key}" for key in service_history_fields.keys()])
                                        insert_sql = f"INSERT INTO sys_service_history ({fields}) VALUES ({placeholders})"
                                        
                                        # 执行插入
                                        try:
                                            conn.execute(text(insert_sql), service_history_fields)
                                        except Exception as e:
                                            print(f"插入服务历程记录时出错: {str(e)}")
                                
                                # 提交事务
                                conn.commit()
                                
                            print("服务历程记录创建完成")
                        except Exception as sh_error:
                            print(f"创建服务历程记录失败: {str(sh_error)}")
                            # 不影响主流程，继续执行
                    
                except Exception as e:
                    success = False
                    error_message = str(e)
                    print(f"批量更新数据失败: {error_message}")
                    traceback.print_exc()
            
            # 处理创建新客户的逻辑
            if records_to_create and create_if_not_exists:
                try:
                    print(f"开始创建 {len(records_to_create)} 条新客户记录")
                    
                    # 添加创建和更新时间
                    current_time = datetime.now()
                    
                    # 逐条创建记录
                    with engine.connect() as conn:
                        for record in records_to_create:
                            # 排除为None的字段
                            create_fields = {k: v for k, v in record.items() if v is not None}
                            
                            # 添加创建和更新时间
                            create_fields['createTime'] = current_time
                            create_fields['updateTime'] = current_time
                            
                            if not create_fields:  # 如果没有需要创建的字段，跳过此记录
                                continue
                            
                            try:
                                # 构建INSERT SQL
                                fields = ', '.join(create_fields.keys())
                                placeholders = ', '.join([f":{key}" for key in create_fields.keys()])
                                insert_sql = f"INSERT INTO sys_customer ({fields}) VALUES ({placeholders})"
                                
                                # 执行插入
                                result = conn.execute(text(insert_sql), create_fields)
                                created_count += 1
                                
                                # 尝试获取新插入记录的ID
                                try:
                                    # 查询刚插入的记录ID
                                    new_id_query = f"SELECT LAST_INSERT_ID()"
                                    new_id_result = conn.execute(text(new_id_query))
                                    new_id = next(new_id_result)[0]
                                    
                                    # 为新创建的客户添加服务历程记录
                                    service_history_fields = {
                                        'companyName': record.get('companyName'),
                                        'unifiedSocialCreditCode': record.get('unifiedSocialCreditCode'),
                                        'consultantAccountant': record.get('consultantAccountant'),
                                        'bookkeepingAccountant': record.get('bookkeepingAccountant'),
                                        'invoiceOfficer': record.get('invoiceOfficer'),
                                        'enterpriseStatus': record.get('enterpriseStatus'),
                                        'businessStatus': record.get('businessStatus'),
                                        'createdAt': current_time,
                                        'updatedAt': current_time
                                    }
                                    
                                    # 移除None值
                                    service_history_fields = {k: v for k, v in service_history_fields.items() if v is not None}
                                    
                                    # 检查是否有关键字段
                                    has_key_field = any(key in service_history_fields for key in [
                                        'consultantAccountant', 'bookkeepingAccountant', 
                                        'invoiceOfficer', 'enterpriseStatus', 'businessStatus'
                                    ])
                                    
                                    # 只有在包含必要字段且有关键字段时才创建记录
                                    if ('companyName' in service_history_fields or 'unifiedSocialCreditCode' in service_history_fields) and has_key_field:
                                        # 构建INSERT SQL
                                        sh_fields = ', '.join(service_history_fields.keys())
                                        sh_placeholders = ', '.join([f":{key}" for key in service_history_fields.keys()])
                                        sh_insert_sql = f"INSERT INTO sys_service_history ({sh_fields}) VALUES ({sh_placeholders})"
                                        
                                        # 执行插入
                                        conn.execute(text(sh_insert_sql), service_history_fields)
                                except Exception as sh_error:
                                    print(f"为新客户创建服务历程记录时出错: {str(sh_error)}")
                                    # 不影响主流程，继续执行
                                
                            except Exception as e:
                                print(f"创建新客户记录时出错: {str(e)}")
                                failed_records.append({
                                    'companyName': record.get('companyName', '未知企业'),
                                    'unifiedSocialCreditCode': record.get('unifiedSocialCreditCode', ''),
                                    'reason': f"创建失败: {str(e)}"
                                })
                        
                        # 提交事务
                        conn.commit()
                    
                    print(f"成功创建 {created_count} 条新客户记录!")
                    
                except Exception as e:
                    success = False
                    error_message = str(e)
                    print(f"批量创建新客户数据失败: {error_message}")
                    traceback.print_exc()

            # 准备结果对象
            # 确保所有值都是有效的JSON值
            sanitized_failed_records = []
            for record in failed_records:
                # 确保所有值都是JSON兼容的
                sanitized_record = {}
                for key, value in record.items():
                    # 对NaN、无穷大等进行特殊处理
                    if key == 'index' or key == 'row':
                        sanitized_record[key] = int(value) if value is not None and not pd.isna(value) else 0
                    elif key == 'unifiedSocialCreditCode':
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else ""
                    elif key == 'companyName':
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else "未知企业"
                    elif key == 'reason':
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else "未知原因"
                    elif key == 'id':
                        sanitized_record[key] = int(value) if value is not None and not pd.isna(value) else 0
                    else:
                        # 其他字段转换为字符串
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else None
                sanitized_failed_records.append(sanitized_record)
                
            result = {
                'success': success and (updated_count > 0 or created_count > 0),
                'updated_count': updated_count,
                'created_count': created_count,  # 新增字段
                'failed_count': len(sanitized_failed_records),
                'failed_records': sanitized_failed_records,
                'error_message': error_message
            }
            
            # 输出JSON格式结果，便于Node.js解析
            print(f"UPDATE_RESULT_JSON: {json.dumps(result)}")
            
            return result

        except Exception as e:
            error_msg = f"更新过程中出错: {str(e)}"
            print(error_msg)
            print(f"错误类型: {type(e).__name__}")
            traceback.print_exc()
            
            # 返回详细错误信息
            sanitized_failed_records = []
            for record in error_info.get('failed_records', []):
                # 确保所有值都是JSON兼容的
                sanitized_record = {}
                for key, value in record.items():
                    # 对NaN、无穷大等进行特殊处理
                    if key == 'index' or key == 'row':
                        sanitized_record[key] = int(value) if value is not None and not pd.isna(value) else 0
                    elif key == 'unifiedSocialCreditCode':
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else ""
                    elif key == 'companyName':
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else "未知企业"
                    elif key == 'reason':
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else "未知原因"
                    elif key == 'id':
                        sanitized_record[key] = int(value) if value is not None and not pd.isna(value) else 0
                    else:
                        # 其他字段转换为字符串
                        sanitized_record[key] = str(value) if value is not None and not pd.isna(value) else None
                sanitized_failed_records.append(sanitized_record)
                
            error_info = {
                "success": False,
                "error_type": "processing_error",
                "error_message": error_msg,
                "failed_records": sanitized_failed_records
            }
            print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
            return False
    
    except Exception as outer_error:
        print(f"致命错误: {str(outer_error)}")
        traceback.print_exc()
        error_info = {
            "success": False,
            "error_type": "fatal_error",
            "error_message": str(outer_error),
            "failed_records": []
        }
        print(f"ERROR_INFO_JSON: {json.dumps(error_info)}")
        return False

def main():
    try:
        # 创建命令行参数解析器
        parser = argparse.ArgumentParser(description='批量更新客户数据')
        parser.add_argument('--file', type=str, help='Excel或CSV文件路径')
        args = parser.parse_args()
        
        # 获取文件路径
        if args.file:
            file_path = args.file
        else:
            print("错误: 未指定文件路径")
            sys.exit(1)
        
        # 更新数据
        print(f"开始批量更新文件: {file_path}")
        result = update_excel_data(file_path)
        
        # 返回结果状态码
        if result and isinstance(result, dict):
            # 打印更新结果摘要
            if result.get('success'):
                print(f"更新完成: 成功更新 {result.get('updated_count')} 条记录")
                if result.get('failed_count', 0) > 0:
                    print(f"有 {result.get('failed_count')} 条记录更新失败")
                sys.exit(0)
            else:
                sys.exit(1)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"主函数异常: {str(e)}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 