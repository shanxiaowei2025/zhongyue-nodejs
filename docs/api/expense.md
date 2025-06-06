# 费用模块API

## 概述

费用模块提供费用管理相关功能，包括费用的创建、查询、更新、删除以及费用审批流程等操作。

## 基本路径

所有费用相关API都以`/api/expenses`为前缀。

## API列表

### 获取费用列表

获取系统中的所有费用列表，支持分页、排序和筛选。

**请求方法**: GET

**URL**: `/api/expenses`

**查询参数**:

- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10
- `sort`: 排序字段，例如`createdAt`
- `order`: 排序方向，`ASC`或`DESC`
- `keyword`: 搜索关键词，会匹配费用标题和说明
- `status`: 费用状态，例如`draft`、`pending`、`approved`、`rejected`
- `type`: 费用类型，例如`travel`、`office`、`entertainment`等
- `userId`: 申请人ID
- `departmentId`: 部门ID
- `startDate`: 费用申请日期范围（开始）
- `endDate`: 费用申请日期范围（结束）
- `minAmount`: 最小金额
- `maxAmount`: 最大金额

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取费用列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "expenseNo": "FY-2023-001",
        "title": "客户拜访差旅费",
        "type": "travel",
        "amount": 2500.50,
        "status": "approved",
        "user": {
          "id": 3,
          "name": "销售经理"
        },
        "department": {
          "id": 3,
          "name": "销售部"
        },
        "applyDate": "2023-01-10",
        "createdAt": "2023-01-10T00:00:00.000Z",
        "updatedAt": "2023-01-15T00:00:00.000Z"
      },
      {
        "id": 2,
        "expenseNo": "FY-2023-002",
        "title": "办公用品采购",
        "type": "office",
        "amount": 1200.00,
        "status": "pending",
        "user": {
          "id": 4,
          "name": "行政专员"
        },
        "department": {
          "id": 1,
          "name": "行政部"
        },
        "applyDate": "2023-01-12",
        "createdAt": "2023-01-12T00:00:00.000Z",
        "updatedAt": "2023-01-12T00:00:00.000Z"
      }
    ],
    "meta": {
      "totalItems": 15,
      "itemCount": 2,
      "itemsPerPage": 10,
      "totalPages": 2,
      "currentPage": 1
    }
  }
}
```

### 获取单个费用

根据费用ID获取单个费用的详细信息。

**请求方法**: GET

**URL**: `/api/expenses/{id}`

**路径参数**:

- `id`: 费用ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取费用成功",
  "data": {
    "id": 1,
    "expenseNo": "FY-2023-001",
    "title": "客户拜访差旅费",
    "type": "travel",
    "amount": 2500.50,
    "description": "前往北京拜访客户的差旅费用，包括机票、住宿和餐饮",
    "status": "approved",
    "applyDate": "2023-01-10",
    "user": {
      "id": 3,
      "name": "销售经理",
      "email": "sales@example.com"
    },
    "department": {
      "id": 3,
      "name": "销售部"
    },
    "items": [
      {
        "id": 1,
        "type": "transportation",
        "description": "往返机票",
        "amount": 1500.00,
        "date": "2023-01-05"
      },
      {
        "id": 2,
        "type": "accommodation",
        "description": "酒店住宿2晚",
        "amount": 800.00,
        "date": "2023-01-05"
      },
      {
        "id": 3,
        "type": "meals",
        "description": "餐饮费用",
        "amount": 200.50,
        "date": "2023-01-06"
      }
    ],
    "attachments": [
      {
        "id": "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p",
        "originalName": "机票发票.pdf",
        "url": "https://api.example.com/uploads/expense/2023/01/10/1673369200000_机票发票.pdf"
      },
      {
        "id": "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
        "originalName": "住宿发票.pdf",
        "url": "https://api.example.com/uploads/expense/2023/01/10/1673369200001_住宿发票.pdf"
      }
    ],
    "approvalProcess": [
      {
        "step": 1,
        "name": "部门经理审批",
        "status": "approved",
        "approver": {
          "id": 5,
          "name": "销售总监"
        },
        "comment": "费用合理，同意报销",
        "approvedAt": "2023-01-12T10:30:00.000Z"
      },
      {
        "step": 2,
        "name": "财务审批",
        "status": "approved",
        "approver": {
          "id": 6,
          "name": "财务经理"
        },
        "comment": "发票齐全，可以报销",
        "approvedAt": "2023-01-15T14:20:00.000Z"
      }
    ],
    "paymentInfo": {
      "paymentMethod": "bank_transfer",
      "accountName": "张三",
      "accountNumber": "6222********1234",
      "bankName": "中国工商银行",
      "paymentDate": "2023-01-20",
      "paymentStatus": "paid"
    },
    "createdAt": "2023-01-10T00:00:00.000Z",
    "updatedAt": "2023-01-15T00:00:00.000Z"
  }
}
```

### 创建费用

创建新费用申请。

**请求方法**: POST

**URL**: `/api/expenses`

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "title": "团队建设活动费用",
  "type": "team_building",
  "description": "团队建设活动费用，包括场地租赁和餐饮",
  "applyDate": "2023-01-20",
  "departmentId": 2,
  "items": [
    {
      "type": "venue",
      "description": "场地租赁费",
      "amount": 3000.00,
      "date": "2023-01-25"
    },
    {
      "type": "meals",
      "description": "团建餐饮费",
      "amount": 2000.00,
      "date": "2023-01-25"
    }
  ],
  "attachmentIds": ["c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8"],
  "paymentInfo": {
    "paymentMethod": "bank_transfer",
    "accountName": "李四",
    "accountNumber": "6222********5678",
    "bankName": "中国建设银行"
  }
}
```

**响应**:

```json
{
  "statusCode": 201,
  "message": "创建费用成功",
  "data": {
    "id": 3,
    "expenseNo": "FY-2023-003",
    "title": "团队建设活动费用",
    "type": "team_building",
    "amount": 5000.00,
    "description": "团队建设活动费用，包括场地租赁和餐饮",
    "status": "draft",
    "applyDate": "2023-01-20",
    "user": {
      "id": 2,
      "name": "项目经理"
    },
    "department": {
      "id": 2,
      "name": "技术部"
    },
    "items": [
      {
        "id": 4,
        "type": "venue",
        "description": "场地租赁费",
        "amount": 3000.00,
        "date": "2023-01-25"
      },
      {
        "id": 5,
        "type": "meals",
        "description": "团建餐饮费",
        "amount": 2000.00,
        "date": "2023-01-25"
      }
    ],
    "createdAt": "2023-01-20T00:00:00.000Z",
    "updatedAt": "2023-01-20T00:00:00.000Z"
  }
}
```

### 更新费用

更新费用信息。

**请求方法**: PUT

**URL**: `/api/expenses/{id}`

**路径参数**:

- `id`: 费用ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "title": "团队建设活动费用（技术部）",
  "description": "技术部团队建设活动费用，包括场地租赁、餐饮和交通",
  "items": [
    {
      "id": 4,
      "amount": 3500.00,
      "description": "场地租赁费（含设备）"
    },
    {
      "id": 5,
      "amount": 2200.00,
      "description": "团建餐饮费（20人）"
    },
    {
      "type": "transportation",
      "description": "交通费",
      "amount": 500.00,
      "date": "2023-01-25"
    }
  ],
  "attachmentIds": [
    "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
    "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9"
  ]
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新费用成功",
  "data": {
    "id": 3,
    "expenseNo": "FY-2023-003",
    "title": "团队建设活动费用（技术部）",
    "amount": 6200.00,
    "description": "技术部团队建设活动费用，包括场地租赁、餐饮和交通",
    "items": [
      {
        "id": 4,
        "type": "venue",
        "description": "场地租赁费（含设备）",
        "amount": 3500.00,
        "date": "2023-01-25"
      },
      {
        "id": 5,
        "type": "meals",
        "description": "团建餐饮费（20人）",
        "amount": 2200.00,
        "date": "2023-01-25"
      },
      {
        "id": 6,
        "type": "transportation",
        "description": "交通费",
        "amount": 500.00,
        "date": "2023-01-25"
      }
    ],
    "updatedAt": "2023-01-22T00:00:00.000Z"
  }
}
```

### 删除费用

删除指定费用。

**请求方法**: DELETE

**URL**: `/api/expenses/{id}`

**路径参数**:

- `id`: 费用ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "删除费用成功",
  "data": null
}
```

### 提交费用审批

将费用提交进入审批流程。

**请求方法**: POST

**URL**: `/api/expenses/{id}/submit`

**路径参数**:

- `id`: 费用ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "comment": "请审批此费用申请"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "提交费用审批成功",
  "data": {
    "id": 3,
    "expenseNo": "FY-2023-003",
    "title": "团队建设活动费用（技术部）",
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
      }
    ],
    "updatedAt": "2023-01-23T00:00:00.000Z"
  }
}
```

### 审批费用

审批人处理费用审批。

**请求方法**: POST

**URL**: `/api/expenses/{id}/approve`

**路径参数**:

- `id`: 费用ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "action": "approve", // 或 "reject"
  "comment": "费用合理，同意报销"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "审批费用成功",
  "data": {
    "id": 3,
    "expenseNo": "FY-2023-003",
    "title": "团队建设活动费用（技术部）",
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
        "comment": "费用合理，同意报销",
        "approvedAt": "2023-01-24T10:30:00.000Z"
      },
      {
        "step": 2,
        "name": "财务审批",
        "status": "pending",
        "approver": {
          "id": 6,
          "name": "财务经理"
        }
      }
    ],
    "updatedAt": "2023-01-24T10:30:00.000Z"
  }
}
```

### 获取费用审批历史

获取费用的审批历史记录。

**请求方法**: GET

**URL**: `/api/expenses/{id}/approval-history`

**路径参数**:

- `id`: 费用ID

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "获取费用审批历史成功",
  "data": [
    {
      "id": 5,
      "expenseId": 3,
      "step": 1,
      "name": "部门经理审批",
      "status": "approved",
      "approver": {
        "id": 8,
        "name": "技术总监"
      },
      "comment": "费用合理，同意报销",
      "createdAt": "2023-01-24T10:30:00.000Z"
    },
    {
      "id": 6,
      "expenseId": 3,
      "step": 2,
      "name": "财务审批",
      "status": "approved",
      "approver": {
        "id": 6,
        "name": "财务经理"
      },
      "comment": "发票已核验，准予报销",
      "createdAt": "2023-01-25T14:20:00.000Z"
    }
  ]
}
```

### 更新费用支付信息

更新费用的支付信息。

**请求方法**: PUT

**URL**: `/api/expenses/{id}/payment`

**路径参数**:

- `id`: 费用ID

**请求头**:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**请求体**:

```json
{
  "paymentMethod": "bank_transfer",
  "paymentDate": "2023-01-30",
  "paymentStatus": "paid",
  "transactionNo": "TX20230130001",
  "remark": "已通过银行转账支付"
}
```

**响应**:

```json
{
  "statusCode": 200,
  "message": "更新费用支付信息成功",
  "data": {
    "id": 3,
    "expenseNo": "FY-2023-003",
    "paymentInfo": {
      "paymentMethod": "bank_transfer",
      "accountName": "李四",
      "accountNumber": "6222********5678",
      "bankName": "中国建设银行",
      "paymentDate": "2023-01-30",
      "paymentStatus": "paid",
      "transactionNo": "TX20230130001",
      "remark": "已通过银行转账支付"
    },
    "status": "completed",
    "updatedAt": "2023-01-30T15:30:00.000Z"
  }
}
```

### 导出费用报表

导出费用报表。

**请求方法**: GET

**URL**: `/api/expenses/export`

**查询参数**:

- `startDate`: 开始日期
- `endDate`: 结束日期
- `departmentId`: 部门ID
- `userId`: 用户ID
- `type`: 费用类型
- `status`: 费用状态
- `format`: 导出格式，可选值为`excel`和`pdf`，默认为`excel`

**请求头**:

```
Authorization: Bearer {accessToken}
```

**响应**:

Excel或PDF文件下载

## 错误响应

### 404 未找到

```json
{
  "statusCode": 404,
  "message": "费用不存在",
  "error": "Not Found"
}
```

### 400 请求错误

```json
{
  "statusCode": 400,
  "message": "费用金额不能为负数",
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

- 费用编号自动生成，遵循"FY-年份-序号"的格式
- 费用一旦进入审批流程，除特定字段外不允许修改
- 费用状态包括：草稿(draft)、审批中(pending)、已批准(approved)、已拒绝(rejected)、已完成(completed)、已取消(canceled)
- 费用金额自动根据费用项目的总和计算
- 只有费用创建者和具有`expense:manage`权限的用户才能修改费用
- 费用删除只在草稿状态允许，其他状态只能取消 