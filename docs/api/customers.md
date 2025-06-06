# 客户模块API

## 概述

客户模块提供客户管理相关功能，包括客户信息的创建、查询、更新、删除以及客户联系人管理等。

## 基本路径

所有客户相关API都以`/api/customers`为前缀。

## API列表

### 获取客户列表

获取系统中的所有客户列表，支持分页、排序和筛选。

**请求方法**: GET

**URL**: `/api/customers`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `sort`: 排序字段，例如`name`
- `order`: 排序方向，`ASC`或`DESC`
- `keyword`: 搜索关键词，会匹配客户名称、编码和联系人
- `type`: 客户类型，例如`company`、`individual`
- `level`: 客户级别，例如`A`、`B`、`C`
- `status`: 客户状态，1表示启用，0表示禁用

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取客户列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "示例公司A",
        "code": "COMP-A",
        "type": "company",
        "level": "A",
        "status": 1,
        "industry": "IT",
        "region": "华东",
        "address": "上海市浦东新区张江高科技园区",
        "website": "https://example-a.com",
        "description": "示例公司A的描述信息",
        "contactName": "张经理",
        "contactPhone": "13800138001",
        "contactEmail": "contact@example-a.com",
        "createdBy": {
          "id": 1,
          "name": "管理员"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "示例公司B",
        "code": "COMP-B",
        "type": "company",
        "level": "B",
        "status": 1,
        "industry": "制造业",
        "region": "华南",
        "address": "广州市天河区",
        "website": "https://example-b.com",
        "description": "示例公司B的描述信息",
        "contactName": "李经理",
        "contactPhone": "13800138002",
        "contactEmail": "contact@example-b.com",
        "createdBy": {
          "id": 2,
          "name": "销售主管"
        },
        "createdAt": "2023-01-02T00:00:00.000Z",
        "updatedAt": "2023-01-02T00:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 50,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 5,
      "currentPage": 1
    }
  }
}
```

### 获取单个客户

根据客户ID获取单个客户的详细信息。

**请求方法**: GET

**URL**: `/api/customers/{id}`

**路径参数**:

- `id`: 客户ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取客户成功",
  "data": {
    "id": 1,
    "name": "示例公司A",
    "code": "COMP-A",
    "type": "company",
    "level": "A",
    "status": 1,
    "industry": "IT",
    "region": "华东",
    "address": "上海市浦东新区张江高科技园区",
    "website": "https://example-a.com",
    "description": "示例公司A的描述信息",
    "source": "网络推广",
    "registrationDate": "2020-01-01",
    "taxNumber": "91310000XXXXXXXX",
    "registrationCapital": "1000万",
    "employeeCount": 200,
    "annualRevenue": "5000万",
    "contactName": "张经理",
    "contactPhone": "13800138001",
    "contactEmail": "contact@example-a.com",
    "createdBy": {
      "id": 1,
      "name": "管理员"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "contacts": [
      {
        "id": 1,
        "name": "张经理",
        "position": "总经理",
        "phone": "13800138001",
        "email": "manager@example-a.com",
        "isPrimary": true
      },
      {
        "id": 2,
        "name": "王助理",
        "position": "行政助理",
        "phone": "13800138011",
        "email": "assistant@example-a.com",
        "isPrimary": false
      }
    ]
  }
}
```

### 创建客户

创建新客户。

**请求方法**: POST

**URL**: `/api/customers`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "新客户公司",
  "code": "COMP-NEW",
  "type": "company",
  "level": "B",
  "status": 1,
  "industry": "教育",
  "region": "华北",
  "address": "北京市海淀区",
  "website": "https://new-customer.com",
  "description": "新客户公司的描述信息",
  "source": "客户推荐",
  "registrationDate": "2021-01-01",
  "taxNumber": "91110000XXXXXXXX",
  "registrationCapital": "500万",
  "employeeCount": 100,
  "annualRevenue": "2000万",
  "contactName": "赵总",
  "contactPhone": "13800138010",
  "contactEmail": "ceo@new-customer.com"
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "创建客户成功",
  "data": {
    "id": 3,
    "name": "新客户公司",
    "code": "COMP-NEW",
    "type": "company",
    "level": "B",
    "status": 1,
    "industry": "教育",
    "region": "华北",
    "address": "北京市海淀区",
    "website": "https://new-customer.com",
    "description": "新客户公司的描述信息",
    "source": "客户推荐",
    "registrationDate": "2021-01-01",
    "taxNumber": "91110000XXXXXXXX",
    "registrationCapital": "500万",
    "employeeCount": 100,
    "annualRevenue": "2000万",
    "contactName": "赵总",
    "contactPhone": "13800138010",
    "contactEmail": "ceo@new-customer.com",
    "createdBy": {
      "id": 1,
      "name": "管理员"
    },
    "createdAt": "2023-01-10T00:00:00.000Z",
    "updatedAt": "2023-01-10T00:00:00.000Z"
  }
}
```

### 更新客户

更新客户信息。

**请求方法**: PUT

**URL**: `/api/customers/{id}`

**路径参数**:

- `id`: 客户ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "更新后的客户公司",
  "level": "A",
  "status": 1,
  "address": "北京市朝阳区",
  "website": "https://updated-customer.com",
  "description": "更新后的描述信息",
  "contactName": "赵总监",
  "contactPhone": "13800138020",
  "contactEmail": "director@updated-customer.com"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新客户成功",
  "data": {
    "id": 3,
    "name": "更新后的客户公司",
    "code": "COMP-NEW",
    "type": "company",
    "level": "A",
    "status": 1,
    "industry": "教育",
    "region": "华北",
    "address": "北京市朝阳区",
    "website": "https://updated-customer.com",
    "description": "更新后的描述信息",
    "source": "客户推荐",
    "registrationDate": "2021-01-01",
    "taxNumber": "91110000XXXXXXXX",
    "registrationCapital": "500万",
    "employeeCount": 100,
    "annualRevenue": "2000万",
    "contactName": "赵总监",
    "contactPhone": "13800138020",
    "contactEmail": "director@updated-customer.com",
    "updatedAt": "2023-01-15T00:00:00.000Z"
  }
}
```

### 删除客户

删除指定客户。

**请求方法**: DELETE

**URL**: `/api/customers/{id}`

**路径参数**:

- `id`: 客户ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除客户成功",
  "data": null
}
```

### 获取客户联系人列表

获取指定客户的所有联系人。

**请求方法**: GET

**URL**: `/api/customers/{id}/contacts`

**路径参数**:

- `id`: 客户ID

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取客户联系人成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "张经理",
        "position": "总经理",
        "department": "管理部",
        "phone": "13800138001",
        "email": "manager@example-a.com",
        "isPrimary": true,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "王助理",
        "position": "行政助理",
        "department": "行政部",
        "phone": "13800138011",
        "email": "assistant@example-a.com",
        "isPrimary": false,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 2,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    }
  }
}
```

### 添加客户联系人

为指定客户添加新的联系人。

**请求方法**: POST

**URL**: `/api/customers/{id}/contacts`

**路径参数**:

- `id`: 客户ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "李工程师",
  "position": "技术总监",
  "department": "技术部",
  "phone": "13800138030",
  "email": "tech@example-a.com",
  "isPrimary": false,
  "remark": "技术对接人"
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "添加联系人成功",
  "data": {
    "id": 3,
    "name": "李工程师",
    "position": "技术总监",
    "department": "技术部",
    "phone": "13800138030",
    "email": "tech@example-a.com",
    "isPrimary": false,
    "remark": "技术对接人",
    "customerId": 1,
    "createdAt": "2023-01-20T00:00:00.000Z",
    "updatedAt": "2023-01-20T00:00:00.000Z"
  }
}
```

### 更新客户联系人

更新客户联系人信息。

**请求方法**: PUT

**URL**: `/api/customers/{id}/contacts/{contactId}`

**路径参数**:

- `id`: 客户ID
- `contactId`: 联系人ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "李总监",
  "position": "CTO",
  "phone": "13800138031",
  "email": "cto@example-a.com",
  "isPrimary": true
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新联系人成功",
  "data": {
    "id": 3,
    "name": "李总监",
    "position": "CTO",
    "department": "技术部",
    "phone": "13800138031",
    "email": "cto@example-a.com",
    "isPrimary": true,
    "remark": "技术对接人",
    "customerId": 1,
    "updatedAt": "2023-01-25T00:00:00.000Z"
  }
}
```

### 删除客户联系人

删除客户的指定联系人。

**请求方法**: DELETE

**URL**: `/api/customers/{id}/contacts/{contactId}`

**路径参数**:

- `id`: 客户ID
- `contactId`: 联系人ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除联系人成功",
  "data": null
}
```

### 导入客户

通过Excel文件批量导入客户。

**请求方法**: POST

**URL**: `/api/customers/import`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**请求体**:

```
file: [Excel文件]
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "导入客户成功",
  "data": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "error": "客户编码已存在"
      },
      {
        "row": 5,
        "error": "必填字段缺失"
      }
    ]
  }
}
```

### 更新客户导入

批量更新现有客户信息。

**请求方法**: POST

**URL**: `/api/customers/update`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**请求体**:

```
file: [Excel文件]
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新客户成功",
  "data": {
    "total": 5,
    "success": 5,
    "failed": 0
  }
}
```

### 导出客户列表

导出客户列表为Excel文件。

**请求方法**: GET

**URL**: `/api/customers/export`

**查询参数**:

- `keyword`: 搜索关键词
- `type`: 客户类型
- `level`: 客户级别
- `status`: 客户状态
- `region`: 客户区域

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

Excel文件下载

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "客户不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "客户编码已存在",
  "error": "Bad Request"
}
```

### 403 禁止访问

```json
{
  "statusCode": 403,
  "message": "没有权限执行此操作",
  "error": "Forbidden"
}
```

## 注意事项

- 客户编码在系统内必须唯一
- 每个客户可以有多个联系人，但只能有一个主要联系人
- 删除客户会同时删除其所有联系人信息
- 只有具有`customer:manage`权限的用户才能执行客户管理操作
- 导入客户时，Excel文件必须符合系统提供的模板格式 