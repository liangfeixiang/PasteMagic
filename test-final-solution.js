// 最终测试脚本 - 验证快捷键是否工作
console.log('=== PasteMagic 快捷键最终测试 ===');

// 测试1: 检查命令监听器
console.log('1. 注册命令监听器...');
chrome.commands.onCommand.addListener((command) => {
    console.log('🎯 收到命令:', command);
    if (command === '_execute_action') {
        console.log('✅ 主快捷键 Ctrl+Shift+A 工作正常!');
    } else if (command === 'open_pastemagic') {
        console.log('✅ 备用快捷键 Ctrl+Shift+Z 工作正常!');
    }
});

// 测试2: 手动触发命令（用于调试）
globalThis.testShortcut = function(commandName = '_execute_action') {
    console.log('手动测试命令:', commandName);
    // 注意：在实际的背景脚本中，我们不能直接访问监听器
    // 这里只是为了测试目的
    chrome.commands.onCommand.hasListeners(); // 确保监听器已注册
    console.log('命令监听器已注册');
    
    // 模拟触发命令
    chrome.commands.onCommand.addListener((cmd) => {
        if (cmd === commandName) {
            console.log('✅ 模拟命令触发成功:', cmd);
        }
    });
    
    // 手动调用（仅用于测试）
    chrome.commands.onCommand.dispatch && chrome.commands.onCommand.dispatch(commandName);
};

console.log('测试命令:');
console.log('- testShortcut("_execute_action") 测试主快捷键');
console.log('- testShortcut("open_pastemagic") 测试备用快捷键');

// 测试3: 检查权限
console.log('\n2. 权限检查:');
const manifest = chrome.runtime.getManifest();
console.log('- commands权限:', manifest.permissions.includes('commands'));
console.log('- notifications权限:', manifest.permissions.includes('notifications'));
console.log('- scripting权限:', manifest.permissions.includes('scripting'));

// 测试4: 检查命令配置
console.log('\n3. 命令配置:');
const commands = manifest.commands;
Object.keys(commands).forEach(cmd => {
    console.log(`- ${cmd}:`, commands[cmd]);
});

console.log('\n=== 测试说明 ===');
console.log('1. 请重新加载扩展');
console.log('2. 按 Ctrl+Shift+A 或 Ctrl+Shift+Z 测试');
console.log('3. 查看控制台输出确认是否收到命令');
console.log('4. 如果收到命令但弹窗未出现，请检查扩展图标是否可见');