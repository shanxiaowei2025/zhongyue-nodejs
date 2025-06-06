# 角色模块API

## 概述

角色模块提供角色管理相关功能，包括角色的创建、查询、更新、删除以及角色权限分配等操作。

## 基本路径

所有角色相关API都以`/api/roles`为前缀。

## API列表

### 获取角色列表

获取系统中的所有角色列表，支持分页和筛选。

**请求方法**: GET

**URL**: `/api/roles`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `keyword`: 搜索关键词，会匹配角色名称和编码
- `status`: 角色状态，1表示启用，0表示禁用

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取角色列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "超级管理员",
        "code": "super_admin",
        "description": "系统超级管理员，拥有所有权限",
        "status": 1,
        "isSystem": true,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "部门管理员",
        "code": "dept_admin",
        "description": "部门管理员，管理部门用户和数据",
        "status": 1,
        "isSystem": true,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 5,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    }
  }
}
```

### 获取单个角色

根据角色ID获取单个角色的详细信息，包括角色所拥有的权限。

**请求方法**: GET

**URL**: `/api/roles/{id}`

**路径参数**:

- `id`: 角色ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取角色成功",
  "data": {
    "id": 2,
    "name": "部门管理员",
    "code": "dept_admin",
    "description": "部门管理员，管理部门用户和数据",
    "status": 1,
    "isSystem": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "permissions": [
      {
        "id": 1,
        "name": "用户管理",
        "code": "user:manage",
        "description": "用户的增删改查操作"
      },
      {
        "id": 2,
        "name": "部门管理",
        "code": "department:manage",
        "description": "部门的增删改查操作"
      },
      {
        "id": 5,
        "name": "角色查看",
        "code": "role:view",
        "description": "查看角色信息"
      }
    ]
  }
}
```

### 创建角色

创建新角色。

**请求方法**: POST

**URL**: `/api/roles`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "项目经理",
  "code": "project_manager",
  "description": "负责项目管理和团队协调",
  "status": 1,
  "permissionIds": [1, 2, 5, 8, 10]
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "创建角色成功",
  "data": {
    "id": 6,
    "name": "项目经理",
    "code": "project_manager",
    "description": "负责项目管理和团队协调",
    "status": 1,
    "isSystem": false,
    "createdAt": "2023-02-01T00:00:00.000Z",
    "updatedAt": "2023-02-01T00:00:00.000Z",
    "permissions": [
      {
        "id": 1,
        "name": "用户管理",
        "code": "user:manage"
      },
      {
        "id": 2,
        "name": "部门管理",
        "code": "department:manage"
      },
      {
        "id": 5,
        "name": "角色查看",
        "code": "role:view"
      },
      {
        "id": 8,
        "name": "客户管理",
        "code": "customer:manage"
      },
      {
        "id": 10,
        "name": "合同管理",
        "code": "contract:manage"
      }
    ]
  }
}
```

### 更新角色

更新角色信息。

**请求方法**: PUT

**URL**: `/api/roles/{id}`

**路径参数**:

- `id`: 角色ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "高级项目经理",
  "description": "负责重要项目的管理和团队协调",
  "status": 1,
  "permissionIds": [1, 2, 5, 8, 10, 12]
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新角色成功",
  "data": {
    "id": 6,
    "name": "高级项目经理",
    "code": "project_manager",
    "description": "负责重要项目的管理和团队协调",
    "status": 1,
    "isSystem": false,
    "updatedAt": "2023-02-10T00:00:00.000Z",
    "permissions": [
      {
        "id": 1,
        "name": "用户管理",
        "code": "user:manage"
      },
      {
        "id": 2,
        "name": "部门管理",
        "code": "department:manage"
      },
      {
        "id": 5,
        "name": "角色查看",
        "code": "role:view"
      },
      {
        "id": 8,
        "name": "客户管理",
        "code": "customer:manage"
      },
      {
        "id": 10,
        "name": "合同管理",
        "code": "contract:manage"
      },
      {
        "id": 12,
        "name": "费用管理",
        "code": "expense:manage"
      }
    ]
  }
}
```

### 删除角色

删除指定角色。

**请求方法**: DELETE

**URL**: `/api/roles/{id}`

**路径参数**:

- `id`: 角色ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除角色成功",
  "data": null
}
```

### 获取角色权限

获取指定角色的所有权限。

**请求方法**: GET

**URL**: `/api/roles/{id}/permissions`

**路径参数**:

- `id`: 角色ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取角色权限成功",
  "data": [
    {
      "id": 1,
      "name": "用户管理",
      "code": "user:manage",
      "description": "用户的增删改查操作",
      "type": "menu",
      "status": 1
    },
    {
      "id": 2,
      "name": "部门管理",
      "code": "department:manage",
      "description": "部门的增删改查操作",
      "type": "menu",
      "status": 1
    },
    {
      "id": 5,
      "name": "角色查看",
      "code": "role:view",
      "description": "查看角色信息",
      "type": "button",
      "status": 1
    }
  ]
}
```

### 更新角色权限

更新指定角色的权限。

**请求方法**: PUT

**URL**: `/api/roles/{id}/permissions`

**路径参数**:

- `id`: 角色ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "permissionIds": [1, 2, 5, 8, 10, 12, 15]
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新角色权限成功",
  "data": {
    "id": 6,
    "name": "高级项目经理",
    "permissions": [
      {
        "id": 1,
        "name": "用户管理",
        "code": "user:manage"
      },
      {
        "id": 2,
        "name": "部门管理",
        "code": "department:manage"
      },
      {
        "id": 5,
        "name": "角色查看",
        "code": "role:view"
      },
      {
        "id": 8,
        "name": "客户管理",
        "code": "customer:manage"
      },
      {
        "id": 10,
        "name": "合同管理",
        "code": "contract:manage"
      },
      {
        "id": 12,
        "name": "费用管理",
        "code": "expense:manage"
      },
      {
        "id": 15,
        "name": "报表查看",
        "code": "report:view"
      }
    ]
  }
}
```

### 获取角色用户

获取指定角色下的所有用户。

**请求方法**: GET

**URL**: `/api/roles/{id}/users`

**路径参数**:

- `id`: 角色ID

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `keyword`: 搜索关键词，会匹配用户名、姓名和邮箱

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取角色用户成功",
  "data": {
    "items": [
      {
        "id": 3,
        "username": "zhangsan",
        "name": "张三",
        "email": "zhangsan@example.com",
        "status": 1,
        "departmentId": 2,
        "departmentName": "技术部"
      },
      {
        "id": 4,
        "username": "lisi",
        "name": "李四",
        "email": "lisi@example.com",
        "status": 1,
        "departmentId": 3,
        "departmentName": "产品部"
      }
    ],
    "meta": {
      "totalItems": 5,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    }
  }
}
```

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "角色不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "角色编码已存在",
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

- 角色编码在系统内必须唯一
- 系统预设角色（isSystem为true）不允许删除
- 用户必须拥有至少一个角色
- 只有具有`role:manage`权限的用户才能执行角色管理操作
- 更新系统预设角色的权限时需要特别谨慎 