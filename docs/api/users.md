# 用户模块API

## 概述

用户模块提供用户管理相关功能，包括用户的创建、查询、更新、删除等操作。

## 基本路径

所有用户相关API都以`/api/users`为前缀。

## API列表

### 获取用户列表

获取系统中的所有用户列表，支持分页、排序和筛选。

**请求方法**: GET

**URL**: `/api/users`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `sort`: 排序字段，例如`name`
- `order`: 排序方向，`ASC`或`DESC`
- `keyword`: 搜索关键词，会匹配用户名、姓名、邮箱等字段
- `status`: 用户状态，1表示启用，0表示禁用

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取用户列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "name": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "status": 1,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "departments": [
          {
            "id": 1,
            "name": "技术部"
          }
        ],
        "roles": [
          {
            "id": 1,
            "name": "管理员"
          }
        ]
      },
      // 更多用户...
    ],
    "meta": {
      "totalItems": 100,
      "itemCount": 10,
      "itemsPerPage": 10,
      "totalPages": 10,
      "currentPage": 1
    }
  }
}
```

### 获取单个用户

根据用户ID获取单个用户的详细信息。

**请求方法**: GET

**URL**: `/api/users/{id}`

**路径参数**:

- `id`: 用户ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取用户成功",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "status": 1,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "departments": [
      {
        "id": 1,
        "name": "技术部",
        "code": "tech"
      }
    ],
    "roles": [
      {
        "id": 1,
        "name": "管理员",
        "code": "admin",
        "permissions": [
          {
            "id": 1,
            "name": "用户管理",
            "code": "user:manage"
          }
        ]
      }
    ]
  }
}
```

### 创建用户

创建新用户。

**请求方法**: POST

**URL**: `/api/users`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "username": "newuser",
  "password": "Password123!",
  "name": "新用户",
  "email": "newuser@example.com",
  "phone": "13800138001",
  "status": 1,
  "departmentIds": [1, 2],
  "roleIds": [2]
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "创建用户成功",
  "data": {
    "id": 3,
    "username": "newuser",
    "name": "新用户",
    "email": "newuser@example.com",
    "phone": "13800138001",
    "status": 1,
    "createdAt": "2023-01-02T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z",
    "departments": [
      {
        "id": 1,
        "name": "技术部"
      },
      {
        "id": 2,
        "name": "产品部"
      }
    ],
    "roles": [
      {
        "id": 2,
        "name": "普通用户"
      }
    ]
  }
}
```

### 更新用户

更新用户信息。

**请求方法**: PUT

**URL**: `/api/users/{id}`

**路径参数**:

- `id`: 用户ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "更新的用户名",
  "email": "updated@example.com",
  "phone": "13800138002",
  "status": 1,
  "departmentIds": [1],
  "roleIds": [2, 3]
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新用户成功",
  "data": {
    "id": 3,
    "username": "newuser",
    "name": "更新的用户名",
    "email": "updated@example.com",
    "phone": "13800138002",
    "status": 1,
    "updatedAt": "2023-01-03T00:00:00.000Z",
    "departments": [
      {
        "id": 1,
        "name": "技术部"
      }
    ],
    "roles": [
      {
        "id": 2,
        "name": "普通用户"
      },
      {
        "id": 3,
        "name": "编辑"
      }
    ]
  }
}
```

### 删除用户

删除指定用户。

**请求方法**: DELETE

**URL**: `/api/users/{id}`

**路径参数**:

- `id`: 用户ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除用户成功",
  "data": null
}
```

### 修改用户密码

管理员修改指定用户的密码。

**请求方法**: PUT

**URL**: `/api/users/{id}/password`

**路径参数**:

- `id`: 用户ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "password": "NewPassword123!"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "修改密码成功",
  "data": null
}
```

### 批量导入用户

通过Excel文件批量导入用户。

**请求方法**: POST

**URL**: `/api/users/import`

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
  "message": "导入用户成功",
  "data": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "error": "用户名已存在"
      },
      {
        "row": 5,
        "error": "邮箱格式不正确"
      }
    ]
  }
}
```

### 导出用户列表

导出用户列表为Excel文件。

**请求方法**: GET

**URL**: `/api/users/export`

**查询参数**:

- `keyword`: 搜索关键词，会匹配用户名、姓名、邮箱等字段
- `status`: 用户状态，1表示启用，0表示禁用
- `departmentId`: 部门ID
- `roleId`: 角色ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

Excel文件下载

### 搜索用户

根据关键词搜索用户。

**请求方法**: GET

**URL**: `/api/users/search`

**查询参数**:

- `keyword`: 搜索关键词
- `limit`: 返回结果数量限制，默认为10

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "搜索用户成功",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "email": "admin@example.com"
    },
    {
      "id": 3,
      "username": "newuser",
      "name": "更新的用户名",
      "email": "updated@example.com"
    }
  ]
}
```

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "用户不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "用户名已存在",
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

- 用户名不能重复
- 邮箱和手机号必须是有效格式，且在系统中唯一
- 创建用户时密码必须符合安全要求（至少8位，包含大小写字母、数字和特殊字符）
- 只有具有`user:manage`权限的用户才能执行用户管理操作