/**
 * WebSocket 客户端测试脚本
 * 
 * 使用方法:
 * 1. npm install socket.io-client
 * 2. node test-websocket-client.js <JWT_TOKEN>
 * 
 * 示例:
 * node test-websocket-client.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

const { io } = require('socket.io-client');

// 从命令行参数获取 JWT Token
const token = process.argv[2];

if (!token) {
    console.error('❌ 请提供 JWT Token 作为参数');
    console.log('使用方法: node test-websocket-client.js <JWT_TOKEN>');
    process.exit(1);
}

console.log('🚀 启动 WebSocket 客户端测试...\n');

// WebSocket 服务器配置
const SERVER_URL = 'http://localhost:3000/ws';

// 创建连接
const socket = io(SERVER_URL, {
    auth: {
        token: token
    },
    transports: ['websocket'], // 强制使用 WebSocket 传输
});

// 连接事件处理
socket.on('connect', () => {
    console.log('✅ WebSocket 连接成功');
    console.log(`📡 Socket ID: ${socket.id}`);
    console.log(`🔗 连接到: ${SERVER_URL}`);
    console.log('');
    
    // 连接成功后的测试
    runTests();
});

socket.on('connect_error', (error) => {
    console.error('❌ 连接失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log(`🔌 连接断开: ${reason}`);
    if (reason === 'io server disconnect') {
        console.log('服务器主动断开连接');
    }
});

// 监听通知事件
socket.on('new-notification', (notification) => {
    console.log('📬 收到新通知:');
    console.log(`   标题: ${notification.title}`);
    console.log(`   内容: ${notification.content}`);
    console.log(`   类型: ${notification.type || 'system'}`);
    console.log(`   ID: ${notification.id}`);
    console.log(`   时间: ${new Date().toLocaleString()}`);
    console.log('');
});

// 监听所有事件（调试用）
socket.onAny((eventName, ...args) => {
    if (eventName !== 'new-notification') {
        console.log(`📨 收到事件 ${eventName}:`, args);
    }
});

// 运行测试
function runTests() {
    console.log('🧪 开始运行连接测试...\n');
    
    // 测试1: 保持连接
    console.log('测试1: 保持连接 - 等待通知推送...');
    console.log('💡 提示: 您可以通过以下方式触发通知:');
    console.log('   1. 使用 test-websocket.html 页面创建通知');
    console.log('   2. 直接调用 API 创建通知');
    console.log('   3. 按 Ctrl+C 退出测试');
    console.log('');
    
    // 发送心跳测试（可选）
    setInterval(() => {
        if (socket.connected) {
            console.log(`💓 连接状态检查: ${new Date().toLocaleTimeString()} - 连接正常`);
        }
    }, 30000); // 每30秒检查一次
}

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n🔄 正在关闭连接...');
    if (socket) {
        socket.disconnect();
    }
    console.log('👋 测试结束');
    process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的 Promise 拒绝:', reason);
    console.error('Promise:', promise);
    process.exit(1);
}); 