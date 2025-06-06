 # 用户管理模块API

本模块提供用户管理相关的API接口，包括用户的创建、查询、更新和删除等功能。

## 接口概览

| 方法   | 路径                  | 描述                 | 权限要求           |
|--------|----------------------|---------------------|-------------------|
| GET    | /api/users           | 获取用户列表          | super_admin, admin |
| GET    | /api/users/search    | 搜索用户(支持模糊查询) | super_admin, admin |
| GET    | /api/users/:id       | 获取用户详情          | super_admin, admin |
| POST   | /api/users           | 创建用户             | super_admin, admin |
| PATCH  | /api/users/:id       | 更新用户信息          | super_admin, admin |
| DELETE | /api/users/:id       | 删除用户             | super_admin, admin |

## 接口详细说明

### 获取用户列表

获取系统中的用户列表，支持分页。

**请求**

```
GET /api/users?page=1&limit=10
```

**参数**

| 参数名 | 类型    | 必选 | 描述       | 默认值 |
|--------|---------|-----|------------|-------|
| page   | integer | 否  | 页码       | 1     |
| limit  | integer | 否  | 每页记录数 | 10    |

**响应**

```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "isActive": true,
        "phone": "13800138000",
        "email": "admin@example.com",
        "roles": ["admin"],
        "createdAt": "2023-05-01T08:00:00.000Z",
        "updatedAt": "2023-05-01T08:00:00.000Z"
      }
    ],
    "meta": {
      "total": 10,
      "page": 1,
      "limit": 10
    }
  },
  "code": 0,
  "message": "操作成功",
  "timestamp": 1684123456789
}
```

### 搜索用户

根据用户名模糊查询用户，支持分页。

**请求**

```
GET /api/users/search?username=关键词&page=1&limit=10
```

**参数**

| 参数名    | 类型    | 必选 | 描述         | 默认值 |
|-----------|---------|-----|--------------|-------|
| username  | string  | 否  | 用户名关键词  | -     |
| page      | integer | 否  | 页码         | 1     |
| limit     | integer | 否  | 每页记录数   | 10    |

**响应**

```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "isActive": true,
        "phone": "13800138000",
        "email": "admin@example.com",
        "roles": ["admin"],
        "createdAt": "2023-05-01T08:00:00.000Z",
        "updatedAt": "2023-05-01T08:00:00.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10
    }
  },
  "code": 0,
  "message": "操作成功",
  "timestamp": 1684123456789
}
```

### 获取用户详情

根据用户ID获取用户详细信息。

**请求**

```
GET /api/users/1
```

**响应**

```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "isActive": true,
    "phone": "13800138000",
    "email": "admin@example.com",
    "roles": ["admin"],
    "dept_id": 1,
    "createdAt": "2023-05-01T08:00:00.000Z",
    "updatedAt": "2023-05-01T08:00:00.000Z"
  },
  "code": 0,
  "message": "操作成功",
  "timestamp": 1684123456789
}
```

### 创建用户

创建新用户。

**请求**

```
POST /api/users
```

**请求体**

```json
{
  "username": "newuser",
  "password": "Password123!",
  "email": "newuser@example.com",
  "phone": "13900139000",
  "roles": ["user"],
  "dept_id": 2,
  "isActive": true
}
```

**响应**

```json
{
  "data": {
    "id": 2,
    "username": "newuser",
    "isActive": true,
    "phone": "13900139000",
    "email": "newuser@example.com",
    "roles": ["user"],
    "dept_id": 2,
    "createdAt": "2023-05-10T10:00:00.000Z",
    "updatedAt": "2023-05-10T10:00:00.000Z"
  },
  "code": 0,
  "message": "操作成功",
  "timestamp": 1684123456789
}
```

### 更新用户信息

更新指定用户的信息。

**请求**

```
PATCH /api/users/2
```

**请求体**

```json
{
  "email": "updated@example.com",
  "phone": "13800138001",
  "isActive": false
}
```

**响应**

```json
{
  "data": {
    "id": 2,
    "username": "newuser",
    "isActive": false,
    "phone": "13800138001",
    "email": "updated@example.com",
    "roles": ["user"],
    "dept_id": 2,
    "createdAt": "2023-05-10T10:00:00.000Z",
    "updatedAt": "2023-05-10T12:00:00.000Z"
  },
  "code": 0,
  "message": "操作成功",
  "timestamp": 1684123456789
}
```

### 删除用户

删除指定的用户。

**请求**

```
DELETE /api/users/2
```

**响应**

```json
{
  "data": null,
  "code": 0,
  "message": "操作成功",
  "timestamp": 1684123456789
}
```

## 业务规则

1. 只有具有`super_admin`或`admin`角色的用户可以访问用户管理接口
2. `super_admin`可以管理除其他`super_admin`外的所有用户
3. `admin`只能管理普通用户，不能管理`admin`和`super_admin`
4. 创建用户时，如果未指定角色，默认为`user`角色
5. 用户名必须唯一，创建时会进行检查
6. 更新用户信息时，如果提供了密码，会自动加密存储