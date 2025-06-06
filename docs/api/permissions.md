# 权限模块API

## 概述

权限模块提供系统权限管理相关功能，包括权限的查询、分配等操作。权限是系统中最基本的访问控制单元，通过角色分配给用户。

## 基本路径

所有权限相关API都以`/api/permissions`为前缀。

## API列表

### 获取权限列表

获取系统中的所有权限列表，支持分页和筛选。

**请求方法**: GET

**URL**: `/api/permissions`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `keyword`: 搜索关键词，会匹配权限名称和编码
- `type`: 权限类型，例如`menu`、`button`、`api`等
- `status`: 权限状态，1表示启用，0表示禁用

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取权限列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "用户管理",
        "code": "user:manage",
        "description": "用户的增删改查操作",
        "type": "menu",
        "status": 1,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "部门管理",
        "code": "department:manage",
        "description": "部门的增删改查操作",
        "type": "menu",
        "status": 1,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 30,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 3,
      "currentPage": 1
    }
  }
}
```

### 获取权限树

获取树状结构的权限列表，通常用于前端权限配置页面展示。

**请求方法**: GET

**URL**: `/api/permissions/tree`

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取权限树成功",
  "data": [
    {
      "id": 1,
      "name": "系统管理",
      "code": "system",
      "type": "menu",
      "children": [
        {
          "id": 2,
          "name": "用户管理",
          "code": "user:manage",
          "type": "menu",
          "children": [
            {
              "id": 6,
              "name": "新增用户",
              "code": "user:create",
              "type": "button",
              "children": []
            },
            {
              "id": 7,
              "name": "编辑用户",
              "code": "user:update",
              "type": "button",
              "children": []
            },
            {
              "id": 8,
              "name": "删除用户",
              "code": "user:delete",
              "type": "button",
              "children": []
            }
          ]
        },
        {
          "id": 3,
          "name": "角色管理",
          "code": "role:manage",
          "type": "menu",
          "children": [
            {
              "id": 9,
              "name": "新增角色",
              "code": "role:create",
              "type": "button",
              "children": []
            },
            {
              "id": 10,
              "name": "编辑角色",
              "code": "role:update",
              "type": "button",
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": 4,
      "name": "业务管理",
      "code": "business",
      "type": "menu",
      "children": [
        {
          "id": 5,
          "name": "客户管理",
          "code": "customer:manage",
          "type": "menu",
          "children": []
        }
      ]
    }
  ]
}
```

### 获取单个权限

根据权限ID获取单个权限的详细信息。

**请求方法**: GET

**URL**: `/api/permissions/{id}`

**路径参数**:

- `id`: 权限ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取权限成功",
  "data": {
    "id": 6,
    "name": "新增用户",
    "code": "user:create",
    "description": "创建新用户",
    "type": "button",
    "status": 1,
    "parentId": 2,
    "parent": {
      "id": 2,
      "name": "用户管理",
      "code": "user:manage"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 创建权限

创建新权限。

**请求方法**: POST

**URL**: `/api/permissions`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "导出客户",
  "code": "customer:export",
  "description": "导出客户列表",
  "type": "button",
  "parentId": 5,
  "status": 1
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "创建权限成功",
  "data": {
    "id": 15,
    "name": "导出客户",
    "code": "customer:export",
    "description": "导出客户列表",
    "type": "button",
    "status": 1,
    "parentId": 5,
    "createdAt": "2023-02-01T00:00:00.000Z",
    "updatedAt": "2023-02-01T00:00:00.000Z",
    "parent": {
      "id": 5,
      "name": "客户管理",
      "code": "customer:manage"
    }
  }
}
```

### 更新权限

更新权限信息。

**请求方法**: PUT

**URL**: `/api/permissions/{id}`

**路径参数**:

- `id`: 权限ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "导出客户数据",
  "description": "导出客户详细数据",
  "status": 1
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新权限成功",
  "data": {
    "id": 15,
    "name": "导出客户数据",
    "code": "customer:export",
    "description": "导出客户详细数据",
    "type": "button",
    "status": 1,
    "parentId": 5,
    "updatedAt": "2023-02-10T00:00:00.000Z"
  }
}
```

### 删除权限

删除指定权限。

**请求方法**: DELETE

**URL**: `/api/permissions/{id}`

**路径参数**:

- `id`: 权限ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除权限成功",
  "data": null
}
```

### 获取权限角色

获取拥有指定权限的所有角色。

**请求方法**: GET

**URL**: `/api/permissions/{id}/roles`

**路径参数**:

- `id`: 权限ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取权限角色成功",
  "data": [
    {
      "id": 1,
      "name": "超级管理员",
      "code": "super_admin",
      "description": "系统超级管理员，拥有所有权限"
    },
    {
      "id": 3,
      "name": "销售经理",
      "code": "sales_manager",
      "description": "销售团队管理者"
    }
  ]
}
```

### 批量操作权限

批量创建、更新或删除权限。

**请求方法**: POST

**URL**: `/api/permissions/batch`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "create": [
    {
      "name": "导入合同",
      "code": "contract:import",
      "description": "批量导入合同",
      "type": "button",
      "parentId": 10,
      "status": 1
    }
  ],
  "update": [
    {
      "id": 15,
      "name": "批量导出客户",
      "description": "批量导出客户详细数据"
    }
  ],
  "delete": [16, 17]
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "批量操作权限成功",
  "data": {
    "created": 1,
    "updated": 1,
    "deleted": 2
  }
}
```

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "权限不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "权限编码已存在",
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

- 权限编码在系统内必须唯一
- 基础权限不允许删除，避免系统功能失效
- 权限分为菜单(menu)、按钮(button)、接口(api)等类型
- 只有具有`permission:manage`权限的用户才能执行权限管理操作
- 删除父级权限会同时删除所有子权限，请谨慎操作 