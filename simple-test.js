// 简单的快捷键测试脚本
console.log('=== PasteMagic 快捷键简单测试 ===');

// 定义测试函数
function testShortcut(commandName = '_execute_action') {
    console.log('测试命令:', commandName);
    
    // 模拟命令触发
    if (commandName === '_execute_action') {
        console.log('✅ 主快捷键测试: Ctrl+Shift+A');
    } else if (commandName === 'open_pastemagic') {
        console.log('✅ 备用快捷键测试: Ctrl+Shift+Z');
    } else {
        console.log('❓ 未知命令:', commandName);
    }
    
    // 检查扩展状态
    console.log('扩展ID:', chrome.runtime.id);
    console.log('扩展版本:', chrome.runtime.getManifest().version);
}

// 将函数暴露到全局作用域
globalThis.testShortcut = testShortcut;

console.log('测试命令已准备就绪:');
console.log('- 运行 testShortcut("_execute_action") 测试主快捷键');
console.log('- 运行 testShortcut("open_pastemagic") 测试备用快捷键');
console.log('- 或直接按 Ctrl+Shift+A / Ctrl+Shift+Z 测试实际快捷键');

// 检查当前配置
console.log('\n当前配置检查:');
const manifest = chrome.runtime.getManifest();
console.log('- 扩展名称:', manifest.name);
console.log('- 命令数量:', Object.keys(manifest.commands || {}).length);

if (manifest.commands) {
    Object.entries(manifest.commands).forEach(([name, config]) => {
        console.log(`- ${name}: ${config.suggested_key?.default || '未设置'}`);
    });
}

console.log('\n💡 提示: 如果快捷键不工作，请:');
console.log('1. 重新加载扩展 (chrome://extensions/)');
console.log('2. 检查快捷键设置 (chrome://extensions/shortcuts)');
console.log('3. 确认没有其他程序占用快捷键');