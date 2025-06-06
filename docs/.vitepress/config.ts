import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "中岳信息管理系统后端",
  description: "基于NestJS的企业级后端解决方案",
  lang: 'zh-CN',
  lastUpdated: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/images/logo.png',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '开发指南', link: '/development/' },
      { text: 'API文档', link: '/api/' },
      { text: '数据库设计', link: '/database/' },
      { text: '部署指南', link: '/deployment/' }
    ],

    sidebar: {
      '/development/': [
        {
          text: '开发指南',
          items: [
            { text: '概述', link: '/development/' },
            { text: '环境配置', link: '/development/environment' },
            { text: '代码规范', link: '/development/coding-standards' },
            { text: '开发流程', link: '/development/workflow' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API文档',
          items: [
            { text: '概述', link: '/api/' },
            { text: '认证', link: '/api/auth' },
            { text: '用户', link: '/api/users' },
            { text: '部门', link: '/api/departments' },
            { text: '客户', link: '/api/customers' },
            { text: '角色', link: '/api/roles' },
            { text: '权限', link: '/api/permissions' },
            { text: '合同', link: '/api/contract' },
            { text: '费用', link: '/api/expense' },
            { text: '存储', link: '/api/storage' }
          ]
        }
      ],
      '/database/': [
        {
          text: '数据库设计',
          items: [
            { text: '概述', link: '/database/' }
          ]
        }
      ],
      '/deployment/': [
        {
          text: '部署指南',
          items: [
            { text: '概述', link: '/deployment/' },
            { text: '开发环境', link: '/deployment/development' },
            { text: '生产环境', link: '/deployment/production' },
            { text: 'Docker部署', link: '/deployment/docker' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shanxiaowei2025/zhongyue-nodejs' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/shanxiaowei2025/zhongyue-nodejs/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    footer: {
      message: 'MIT Licensed',
      copyright: 'Copyright © 2024'
    }
  }
}) 