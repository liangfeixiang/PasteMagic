// Background script for handling keyboard shortcuts
// This script runs in the background and listens for extension commands

// 简单直接的实现
chrome.commands.onCommand.addListener((command) => {
  console.log('[PasteMagic] 收到命令:', command);
  
  if (command === '_execute_action') {
    console.log('[PasteMagic] 快捷键触发成功:', command);
    
    // 最简单的方法：显示通知提醒用户
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('pastemagic_32.png'),
      title: 'PasteMagic',
      message: `快捷键 ${command === '_execute_action' ? 'Option+Shift+A' : 'Option+Shift+Z'} 已触发！请点击浏览器工具栏中的 PasteMagic 图标。`
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('[PasteMagic] 通知创建失败:', chrome.runtime.lastError.message);
        // 备用方案：使用默认图标
        const backupMessage = command === '_execute_action' 
          ? '快捷键已触发！请手动点击 PasteMagic 扩展图标。'
          : '备用快捷键已触发！请手动点击 PasteMagic 扩展图标。';
        
        chrome.notifications.create({
          type: 'basic',
          title: 'PasteMagic',
          message: backupMessage
        }, (retryNotificationId) => {
          if (chrome.runtime.lastError) {
            console.log('[PasteMagic] 💡 请手动点击 PasteMagic 扩展图标');
          } else {
            console.log('[PasteMagic] 已显示备用通知');
          }
        });
      } else {
        console.log('[PasteMagic] 已显示通知提醒用户');
      }
    });
    
    // 同时尝试激活扩展（在支持的窗口中）
    chrome.action.openPopup().catch(err => {
      console.log('[PasteMagic] openPopup 在此窗口不可用（正常）:', err.message);
      console.log('[PasteMagic] ℹ️ 这是正常现象，特别是在全屏或特殊窗口中');
    });
  }
});

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('PasteMagic extension installed');
  } else if (details.reason === 'update') {
    console.log('PasteMagic extension updated');
  }
});

console.log('Background script loaded - 监听快捷键 Ctrl+Shift+A');