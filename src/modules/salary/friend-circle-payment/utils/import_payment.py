#!/usr/bin/env python3
import sys
import json
import pandas as pd # type: ignore
import numpy as np # type: ignore
from io import BytesIO
from datetime import datetime
from dateutil.relativedelta import relativedelta

def validate_date_range(df, date_column):
    """
    验证数据中的日期是否为上个月
    
    参数:
        df: DataFrame对象
        date_column: 日期列名
    
    返回:
        (is_valid, error_message, invalid_records)
    """
    # 计算上个月的年月
    current_date = datetime.now()
    last_month = current_date - relativedelta(months=1)
    expected_year_month = last_month.strftime("%Y-%m")
    
    invalid_records = []
    
    # 检查每条记录的日期
    for idx, row in df.iterrows():
        if date_column in df.columns:
            date_value = row[date_column]
            if pd.notna(date_value):  # 只检查非空值
                try:
                    # 尝试解析日期
                    if isinstance(date_value, str):
                        # 提取年月部分 (YYYY-MM)
                        date_str = date_value.strip()
                        if len(date_str) >= 7:
                            year_month = date_str[:7]
                        else:
                            year_month = date_str
                    else:
                        # 如果是日期对象，转换为字符串
                        year_month = pd.to_datetime(date_value).strftime("%Y-%m")
                    
                    # 检查是否为上个月
                    if year_month != expected_year_month:
                        invalid_records.append({
                            "row": idx + 2,  # 考虑表头行
                            "date": year_month,
                            "expected": expected_year_month
                        })
                except Exception as e:
                    # 日期格式错误也记录
                    invalid_records.append({
                        "row": idx + 2,
                        "date": str(date_value),
                        "expected": expected_year_month,
                        "error": f"日期格式错误: {str(e)}"
                    })
    
    if invalid_records:
        error_message = f"只能导入上个月({expected_year_month})的数据。发现 {len(invalid_records)} 条不符合要求的记录。"
        return False, error_message, invalid_records
    
    return True, None, []

def main():
    # 从标准输入读取文件内容
    file_content = sys.stdin.buffer.read()
    filename = sys.argv[1] if len(sys.argv) > 1 else ''
    overwrite_mode = '--overwrite' in sys.argv
    
    try:
        # 根据文件类型处理
        if filename.lower().endswith('.csv'):
            df = pd.read_csv(BytesIO(file_content))
        elif filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(BytesIO(file_content))
        else:
            raise ValueError("不支持的文件格式，仅支持CSV或Excel文件")
        
        # 替换NaN值为None，这样JSON序列化时会转为null
        df = df.replace({np.nan: None})
        
        # 验证日期范围 - 在处理数据之前进行验证
        if "年月" in df.columns:
            is_valid, error_message, invalid_records = validate_date_range(df, "年月")
            if not is_valid:
                error_result = {
                    "success": False,
                    "error": "invalid_date_range",
                    "message": "只能导入上个月数据，导入失败。",
                    "details": error_message,
                    "invalidRecords": invalid_records
                }
                print(json.dumps(error_result, ensure_ascii=False))
                sys.exit(1)
        
        # 准备结果
        result = {
            "success": True,
            "data": [],
            "failedRecords": [],
            "overwriteMode": overwrite_mode
        }
        
        # 字段映射
        column_mapping = {
            "姓名": "name",
            "第一周": "weekOne",
            "第二周": "weekTwo",
            "第三周": "weekThree",
            "第四周": "weekFour",
            "总数": "totalCount",
            "扣款": "payment",
            "是否完成": "isCompleted",
            "年月": "yearMonth"
        }
        
        # 重命名列名
        for idx, row in df.iterrows():
            record = {}
            errors = []
            
            # 处理必填字段
            for original_col, mapped_col in column_mapping.items():
                if original_col in df.columns:
                    val = row[original_col]
                    
                    # 特殊处理 "是否完成" 字段
                    if mapped_col == "isCompleted" and val is not None:
                        if isinstance(val, str):
                            if val.strip() in ["1", "是", "已完成", "完成", "true", "True"]:
                                record[mapped_col] = True
                            elif val.strip() in ["0", "否", "未完成", "false", "False"]:
                                record[mapped_col] = False
                            else:
                                errors.append(f"是否完成格式错误: '{val}'")
                        elif isinstance(val, (int, float)):
                            record[mapped_col] = bool(val)
                        else:
                            errors.append(f"是否完成格式错误: '{val}'")
                    
                    # 处理数值型字段
                    elif mapped_col in ["weekOne", "weekTwo", "weekThree", "weekFour", "totalCount", "payment"]:
                        try:
                            if val is not None:
                                if isinstance(val, (int, float)):
                                    record[mapped_col] = float(val)
                                elif isinstance(val, str) and val.strip():
                                    # 尝试将字符串转换为数字
                                    cleaned_val = val.replace(',', '')  # 去除逗号
                                    record[mapped_col] = float(cleaned_val)
                                else:
                                    record[mapped_col] = None
                            else:
                                record[mapped_col] = None
                        except ValueError:
                            errors.append(f"{original_col}格式错误: '{val}'")
                    
                    # 其他字符串字段
                    else:
                        if val is not None:
                            if isinstance(val, (int, float)):
                                record[mapped_col] = str(val)
                            else:
                                record[mapped_col] = str(val).strip()
                        else:
                            record[mapped_col] = None
            
            # 处理总数字段
            if "totalCount" not in record or record["totalCount"] is None:
                # 自动计算总数
                week_fields = ["weekOne", "weekTwo", "weekThree", "weekFour"]
                week_values = [record.get(field, 0) or 0 for field in week_fields]
                record["totalCount"] = sum(week_values)
            
            # 验证必填字段
            required_fields = ["name", "weekOne", "weekTwo", "weekThree", "weekFour", "payment", "isCompleted"]
            for field in required_fields:
                if field not in record or record[field] is None:
                    errors.append(f"缺少必填字段: {field}")
            
            # 根据验证结果添加到相应列表
            if errors:
                failed_record = {
                    "row": idx + 2,  # 考虑表头行，行号从2开始
                    "name": record.get("name", "未知"),
                    "errors": errors,
                    "reason": f"数据验证失败: {', '.join(errors)}"
                }
                result["failedRecords"].append(failed_record)
            else:
                result["data"].append(record)
        
        # 输出JSON结果
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "details": "处理文件时发生错误"
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main() 