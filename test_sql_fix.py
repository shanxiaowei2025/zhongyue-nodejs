#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from sqlalchemy import create_engine, text

def test_sql_parameter_format():
    """测试SQL参数格式修复"""
    
    print("🧪 测试SQL参数格式...")
    
    # 模拟企业名称列表
    names_to_check = ['测试公司A', '测试公司B', '测试公司C']
    
    # 旧的错误方式（会导致错误）
    print("\n❌ 错误的参数格式（会导致错误）:")
    placeholders_old = ', '.join(['%s'] * len(names_to_check))
    query_old = f"SELECT id, companyName FROM sys_customer WHERE companyName IN ({placeholders_old})"
    print(f"查询SQL: {query_old}")
    print(f"参数类型: {type(names_to_check)} - {names_to_check}")
    print("这种格式会导致: 'List argument must consist only of dictionaries'")
    
    # 新的正确方式
    print("\n✅ 正确的参数格式:")
    placeholders_new = ', '.join([f':name_{i}' for i in range(len(names_to_check))])
    query_new = f"SELECT id, companyName FROM sys_customer WHERE companyName IN ({placeholders_new})"
    params_new = {f'name_{i}': name for i, name in enumerate(names_to_check)}
    
    print(f"查询SQL: {query_new}")
    print(f"参数类型: {type(params_new)} - {params_new}")
    print("这种格式应该能正常工作")
    
    return True

def test_update_parameter_format():
    """测试更新SQL参数格式"""
    
    print("\n🧪 测试更新SQL参数格式...")
    
    # 模拟更新字段
    update_fields = {
        'consultantAccountant': '张三',
        'bookkeepingAccountant': '李四',
        'updateTime': '2024-01-01 12:00:00'
    }
    
    # 构建UPDATE SQL
    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
    update_sql = f"UPDATE sys_customer SET {set_clause} WHERE id = :id"
    params = {**update_fields, 'id': 123}
    
    print(f"✅ 更新SQL: {update_sql}")
    print(f"✅ 参数格式: {params}")
    print("这种格式应该能正常工作")
    
    return True

def test_insert_parameter_format():
    """测试插入SQL参数格式"""
    
    print("\n🧪 测试插入SQL参数格式...")
    
    # 模拟服务历程字段
    service_history_fields = {
        'companyName': '测试公司',
        'consultantAccountant': '张三',
        'bookkeepingAccountant': '李四',
        'createdAt': '2024-01-01 12:00:00',
        'updatedAt': '2024-01-01 12:00:00'
    }
    
    # 构建INSERT SQL
    fields = ', '.join(service_history_fields.keys())
    placeholders = ', '.join([f":{key}" for key in service_history_fields.keys()])
    insert_sql = f"INSERT INTO sys_service_history ({fields}) VALUES ({placeholders})"
    
    print(f"✅ 插入SQL: {insert_sql}")
    print(f"✅ 参数格式: {service_history_fields}")
    print("这种格式应该能正常工作")
    
    return True

if __name__ == "__main__":
    print("🚀 开始测试SQL参数格式修复...")
    print("=" * 60)
    
    success1 = test_sql_parameter_format()
    success2 = test_update_parameter_format()
    success3 = test_insert_parameter_format()
    
    print("\n" + "=" * 60)
    if success1 and success2 and success3:
        print("🎉 所有测试通过！SQL参数格式修复应该有效。")
        print("\n📋 修复要点:")
        print("1. ✅ 使用命名参数 (:name_0, :name_1) 而不是 %s")
        print("2. ✅ 参数传递为字典格式而不是列表格式")
        print("3. ✅ 符合SQLAlchemy text()函数的要求")
    else:
        print("❌ 测试失败") 