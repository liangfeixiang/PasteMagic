// PasteMagic 扩展调试工具
console.log('=== PasteMagic 扩展调试工具 ===');

// 1. 检查扩展基本信息
console.log('1. 扩展信息:');
console.log('- ID:', chrome.runtime.id);
console.log('- 名称:', chrome.runtime.getManifest().name);
console.log('- 版本:', chrome.runtime.getManifest().version);

// 2. 检查权限
console.log('\n2. 权限检查:');
const permissions = chrome.runtime.getManifest().permissions || [];
console.log('- commands:', permissions.includes('commands'));
console.log('- notifications:', permissions.includes('notifications'));
console.log('- scripting:', permissions.includes('scripting'));

// 3. 检查命令配置
console.log('\n3. 命令配置:');
const commands = chrome.runtime.getManifest().commands || {};
Object.entries(commands).forEach(([name, config]) => {
    console.log(`- ${name}:`);
    console.log('  快捷键:', config.suggested_key?.default || '未设置');
    console.log('  描述:', config.description || '无描述');
});

// 4. 测试命令监听
console.log('\n4. 命令监听测试:');
let commandReceived = false;

chrome.commands.onCommand.addListener((command) => {
    commandReceived = true;
    console.log('🎯 收到命令:', command);
    if (command === '_execute_action') {
        console.log('✅ 主快捷键 (Option+Shift+A) 工作正常!');
    } else if (command === 'open_pastemagic') {
        console.log('✅ 备用快捷键 (Option+Shift+Z) 工作正常!');
    }
});

// 5. 提供手动测试功能
function manualTest(commandName) {
    console.log('手动触发命令:', commandName);
    // 这里只是模拟，实际的命令触发需要通过快捷键
    chrome.commands.onCommand.hasListeners(); // 确保监听器存在
    console.log('监听器状态: 已注册');
}

// 6. 检查扩展状态
async function checkExtensionStatus() {
    try {
        const result = await chrome.management.get(chrome.runtime.id);
        console.log('\n扩展状态:');
        console.log('- 启用状态:', result.enabled ? '✅ 已启用' : '❌ 已禁用');
        console.log('- 安装类型:', result.installType);
    } catch (error) {
        console.error('检查扩展状态失败:', error);
    }
}

// 7. 提供用户操作指引
console.log('\n=== 使用说明 ===');
console.log('📋 调试步骤:');
console.log('1. 确保扩展已启用 (chrome://extensions/)');
console.log('2. 检查快捷键设置 (chrome://extensions/shortcuts)');
console.log('3. 按下 Ctrl+Shift+A 或 Ctrl+Shift+Z 测试');
console.log('4. 查看此控制台的输出信息');

console.log('\n🔧 调试命令:');
console.log('- manualTest("_execute_action") // 测试主快捷键监听');
console.log('- manualTest("open_pastemagic")  // 测试备用快捷键监听');
console.log('- checkExtensionStatus()        // 检查扩展状态');

console.log('\n⚠️  注意事项:');
console.log('- 快捷键可能与其他程序冲突');
console.log('- 某些网站可能阻止扩展运行');
console.log('- 需要重新加载扩展才能使更改生效');

// 导出函数到全局作用域
globalThis.manualTest = manualTest;
globalThis.checkExtensionStatus = checkExtensionStatus;

// 初始化检查
checkExtensionStatus();