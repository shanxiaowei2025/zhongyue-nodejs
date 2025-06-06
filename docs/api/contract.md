# 合同模块API

## 概述

合同模块提供合同管理相关功能，包括合同的创建、查询、更新、删除以及合同审批流程等操作。

## 基本路径

所有合同相关API都以`/api/contracts`为前缀。

## API列表

### 获取合同列表

获取系统中的所有合同列表，支持分页、排序和筛选。

**请求方法**: GET

**URL**: `/api/contracts`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `sort`: 排序字段，例如`createdAt`
- `order`: 排序方向，`ASC`或`DESC`
- `keyword`: 搜索关键词，会匹配合同名称、编号和客户名称
- `status`: 合同状态，例如`draft`、`pending`、`approved`、`rejected`、`expired`
- `customerId`: 客户ID
- `userId`: 负责人ID
- `startDate`: 合同开始日期范围（开始）
- `endDate`: 合同开始日期范围（结束）

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取合同列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "contractNo": "HT-2023-001",
        "name": "服务器租赁合同",
        "customer": {
          "id": 1,
          "name": "示例公司A",
          "code": "COMP-A"
        },
        "amount": 50000.00,
        "startDate": "2023-01-01",
        "endDate": "2023-12-31",
        "status": "approved",
        "user": {
          "id": 3,
          "name": "销售经理"
        },
        "createdAt": "2022-12-15T00:00:00.000Z",
        "updatedAt": "2022-12-20T00:00:00.000Z"
      },
      {
        "id": 2,
        "contractNo": "HT-2023-002",
        "name": "软件开发合同",
        "customer": {
          "id": 2,
          "name": "示例公司B",
          "code": "COMP-B"
        },
        "amount": 200000.00,
        "startDate": "2023-02-01",
        "endDate": "2023-07-31",
        "status": "pending",
        "user": {
          "id": 4,
          "name": "项目经理"
        },
        "createdAt": "2023-01-10T00:00:00.000Z",
        "updatedAt": "2023-01-10T00:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 20,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 2,
      "currentPage": 1
    }
  }
}
```

### 获取单个合同

根据合同ID获取单个合同的详细信息。

**请求方法**: GET

**URL**: `/api/contracts/{id}`

**路径参数**:

- `id`: 合同ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取合同成功",
  "data": {
    "id": 1,
    "contractNo": "HT-2023-001",
    "name": "服务器租赁合同",
    "type": "service",
    "customer": {
      "id": 1,
      "name": "示例公司A",
      "code": "COMP-A",
      "contactPerson": "张经理",
      "contactPhone": "13800138001"
    },
    "amount": 50000.00,
    "discount": 0,
    "finalAmount": 50000.00,
    "startDate": "2023-01-01",
    "endDate": "2023-12-31",
    "signDate": "2022-12-20",
    "description": "年度服务器租赁合同",
    "content": "本合同是关于服务器租赁的详细协议...",
    "terms": [
      "服务期限为一年",
      "每季度支付租金",
      "提供7x24小时技术支持"
    ],
    "attachments": [
      {
        "id": "f8e7d6c5-b4a3-2c1d-0e9f-8g7h6i5j4k3l",
        "originalName": "合同扫描件.pdf",
        "url": "https://api.example.com/uploads/contract/2022/12/20/1671548400000_合同扫描件.pdf"
      }
    ],
    "status": "approved",
    "user": {
      "id": 3,
      "name": "销售经理",
      "email": "sales@example.com"
    },
    "department": {
      "id": 3,
      "name": "销售部"
    },
    "approvalProcess": [
      {
        "step": 1,
        "name": "部门经理审批",
        "status": "approved",
        "approver": {
          "id": 5,
          "name": "销售总监"
        },
        "comment": "合同条款符合标准",
        "approvedAt": "2022-12-18T10:30:00.000Z"
      },
      {
        "step": 2,
        "name": "财务审批",
        "status": "approved",
        "approver": {
          "id": 6,
          "name": "财务经理"
        },
        "comment": "金额核算无误",
        "approvedAt": "2022-12-19T14:20:00.000Z"
      },
      {
        "step": 3,
        "name": "法务审批",
        "status": "approved",
        "approver": {
          "id": 7,
          "name": "法务专员"
        },
        "comment": "合同内容合法有效",
        "approvedAt": "2022-12-20T09:15:00.000Z"
      }
    ],
    "paymentSchedule": [
      {
        "id": 1,
        "installment": 1,
        "dueDate": "2023-03-31",
        "amount": 12500.00,
        "status": "paid",
        "paidDate": "2023-03-28",
        "paidAmount": 12500.00
      },
      {
        "id": 2,
        "installment": 2,
        "dueDate": "2023-06-30",
        "amount": 12500.00,
        "status": "pending",
        "paidDate": null,
        "paidAmount": 0
      }
    ],
    "createdBy": {
      "id": 3,
      "name": "销售经理"
    },
    "createdAt": "2022-12-15T00:00:00.000Z",
    "updatedAt": "2022-12-20T00:00:00.000Z"
  }
}
```

### 创建合同

创建新合同。

**请求方法**: POST

**URL**: `/api/contracts`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "技术咨询服务合同",
  "type": "service",
  "customerId": 3,
  "amount": 80000.00,
  "discount": 5000.00,
  "startDate": "2023-03-01",
  "endDate": "2023-08-31",
  "signDate": "2023-02-20",
  "description": "提供技术咨询和培训服务",
  "content": "本合同是关于技术咨询服务的详细协议...",
  "terms": [
    "服务期限为六个月",
    "按月提供咨询报告",
    "每周安排两次线上培训"
  ],
  "attachmentIds": ["a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"],
  "userId": 4,
  "departmentId": 2,
  "paymentSchedule": [
    {
      "installment": 1,
      "dueDate": "2023-03-15",
      "amount": 40000.00
    },
    {
      "installment": 2,
      "dueDate": "2023-06-15",
      "amount": 35000.00
    }
  ]
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "创建合同成功",
  "data": {
    "id": 3,
    "contractNo": "HT-2023-003",
    "name": "技术咨询服务合同",
    "type": "service",
    "customer": {
      "id": 3,
      "name": "新客户公司"
    },
    "amount": 80000.00,
    "discount": 5000.00,
    "finalAmount": 75000.00,
    "startDate": "2023-03-01",
    "endDate": "2023-08-31",
    "signDate": "2023-02-20",
    "description": "提供技术咨询和培训服务",
    "status": "draft",
    "user": {
      "id": 4,
      "name": "项目经理"
    },
    "department": {
      "id": 2,
      "name": "技术部"
    },
    "createdBy": {
      "id": 1,
      "name": "管理员"
    },
    "createdAt": "2023-02-10T00:00:00.000Z",
    "updatedAt": "2023-02-10T00:00:00.000Z"
  }
}
```

### 更新合同

更新合同信息。

**请求方法**: PUT

**URL**: `/api/contracts/{id}`

**路径参数**:

- `id`: 合同ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "name": "技术咨询与培训服务合同",
  "amount": 85000.00,
  "discount": 7500.00,
  "description": "提供技术咨询、培训和技术支持服务",
  "paymentSchedule": [
    {
      "installment": 1,
      "dueDate": "2023-03-15",
      "amount": 40000.00
    },
    {
      "installment": 2,
      "dueDate": "2023-06-15",
      "amount": 37500.00
    }
  ]
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新合同成功",
  "data": {
    "id": 3,
    "contractNo": "HT-2023-003",
    "name": "技术咨询与培训服务合同",
    "amount": 85000.00,
    "discount": 7500.00,
    "finalAmount": 77500.00,
    "description": "提供技术咨询、培训和技术支持服务",
    "updatedAt": "2023-02-15T00:00:00.000Z"
  }
}
```

### 删除合同

删除指定合同。

**请求方法**: DELETE

**URL**: `/api/contracts/{id}`

**路径参数**:

- `id`: 合同ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除合同成功",
  "data": null
}
```

### 提交合同审批

将合同提交进入审批流程。

**请求方法**: POST

**URL**: `/api/contracts/{id}/submit`

**路径参数**:

- `id`: 合同ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "comment": "请审批此合同"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "提交合同审批成功",
  "data": {
    "id": 3,
    "contractNo": "HT-2023-003",
    "name": "技术咨询与培训服务合同",
    "status": "pending",
    "currentApprovalStep": 1,
    "approvalProcess": [
      {
        "step": 1,
        "name": "部门经理审批",
        "status": "pending",
        "approver": {
          "id": 8,
          "name": "技术总监"
        }
      },
      {
        "step": 2,
        "name": "财务审批",
        "status": "waiting",
        "approver": {
          "id": 6,
          "name": "财务经理"
        }
      },
      {
        "step": 3,
        "name": "法务审批",
        "status": "waiting",
        "approver": {
          "id": 7,
          "name": "法务专员"
        }
      }
    ],
    "updatedAt": "2023-02-16T00:00:00.000Z"
  }
}
```

### 审批合同

审批人处理合同审批。

**请求方法**: POST

**URL**: `/api/contracts/{id}/approve`

**路径参数**:

- `id`: 合同ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "action": "approve", // 或 "reject"
  "comment": "合同内容符合规范，同意通过"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "审批合同成功",
  "data": {
    "id": 3,
    "contractNo": "HT-2023-003",
    "name": "技术咨询与培训服务合同",
    "status": "pending",
    "currentApprovalStep": 2,
    "approvalProcess": [
      {
        "step": 1,
        "name": "部门经理审批",
        "status": "approved",
        "approver": {
          "id": 8,
          "name": "技术总监"
        },
        "comment": "合同内容符合规范，同意通过",
        "approvedAt": "2023-02-17T10:30:00.000Z"
      },
      {
        "step": 2,
        "name": "财务审批",
        "status": "pending",
        "approver": {
          "id": 6,
          "name": "财务经理"
        }
      },
      {
        "step": 3,
        "name": "法务审批",
        "status": "waiting",
        "approver": {
          "id": 7,
          "name": "法务专员"
        }
      }
    ],
    "updatedAt": "2023-02-17T10:30:00.000Z"
  }
}
```

### 获取合同审批历史

获取合同的审批历史记录。

**请求方法**: GET

**URL**: `/api/contracts/{id}/approval-history`

**路径参数**:

- `id`: 合同ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取合同审批历史成功",
  "data": [
    {
      "id": 10,
      "contractId": 3,
      "step": 1,
      "name": "部门经理审批",
      "status": "approved",
      "approver": {
        "id": 8,
        "name": "技术总监"
      },
      "comment": "合同内容符合规范，同意通过",
      "createdAt": "2023-02-17T10:30:00.000Z"
    },
    {
      "id": 11,
      "contractId": 3,
      "step": 2,
      "name": "财务审批",
      "status": "approved",
      "approver": {
        "id": 6,
        "name": "财务经理"
      },
      "comment": "财务条款合理，同意通过",
      "createdAt": "2023-02-18T14:20:00.000Z"
    }
  ]
}
```

### 更新合同支付信息

更新合同付款信息。

**请求方法**: PUT

**URL**: `/api/contracts/{id}/payments/{paymentId}`

**路径参数**:

- `id`: 合同ID
- `paymentId`: 付款项ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "status": "paid",
  "paidDate": "2023-03-15",
  "paidAmount": 40000.00,
  "comment": "首期款项已支付"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新合同支付信息成功",
  "data": {
    "id": 5,
    "contractId": 3,
    "installment": 1,
    "dueDate": "2023-03-15",
    "amount": 40000.00,
    "status": "paid",
    "paidDate": "2023-03-15",
    "paidAmount": 40000.00,
    "comment": "首期款项已支付",
    "updatedAt": "2023-03-15T15:30:00.000Z"
  }
}
```

### 导出合同

将合同导出为PDF文件。

**请求方法**: GET

**URL**: `/api/contracts/{id}/export`

**路径参数**:

- `id`: 合同ID

**查询参数**:

- `type`: 导出类型，可选值为`simple`（简版）和`full`（完整版），默认为`full`

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

PDF文件下载

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "合同不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "合同金额不能为负数",
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

- 合同编号自动生成，遵循"HT-年份-序号"的格式
- 合同一旦进入审批流程，除特定字段外不允许修改
- 合同状态包括：草稿(draft)、审批中(pending)、已批准(approved)、已拒绝(rejected)、已完成(completed)、已取消(canceled)、已过期(expired)
- 只有具有`contract:manage`权限的用户才能执行合同管理操作
- 合同删除只在草稿状态允许，其他状态只能取消 