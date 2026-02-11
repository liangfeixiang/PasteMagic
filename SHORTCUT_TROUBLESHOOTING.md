# PasteMagic 快捷键使用说明

## 默认快捷键
- **主要快捷键**: `Ctrl+Shift+A` (打开 PasteMagic 弹窗)
- **备用快捷键**: `Alt+Shift+P` (新增的替代快捷键)

## 如果快捷键不生效，请按以下步骤排查：

### 1. 检查扩展是否正确加载
- 打开 `chrome://extensions/`
- 确保 PasteMagic 扩展已启用
- 点击"重新加载"按钮刷新扩展

### 2. 检查快捷键设置
- 打开 `chrome://extensions/shortcuts`
- 查找 "PasteMagic – Smart Dev Parser"
- 确认快捷键已正确设置
- 如果未显示，可以手动设置快捷键

### 3. 常见问题解决

#### 问题1：快捷键冲突
- 检查是否有其他扩展使用了相同的快捷键
- 在 `chrome://extensions/shortcuts` 中修改为其他组合键

#### 问题2：系统快捷键冲突
- 某些操作系统快捷键可能会拦截浏览器快捷键
- 尝试使用备用快捷键 `Alt+Shift+P`

#### 问题3：扩展权限问题
- 确保扩展具有 "commands" 权限
- 检查 manifest.json 中的 permissions 字段

### 4. 手动设置快捷键步骤
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/shortcuts`
3. 找到 "PasteMagic – Smart Dev Parser"
4. 点击快捷键输入框
5. 按下你想要的组合键（如 Ctrl+Shift+A）
6. 点击页面其他地方保存设置

### 5. 调试方法
如果你是开发者，可以：
1. 打开 Chrome 开发者工具 (F12)
2. 切换到 Console 标签
3. 运行调试脚本查看详细信息

## 技术细节

### Manifest V3 配置
```json
{
  "permissions": ["commands"],
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+A"
      },
      "description": "Open PasteMagic popup"
    }
  }
}
```

### 背景脚本处理
```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.action.openPopup();
  }
});
```

## 支持的快捷键格式
- `Ctrl+Shift+字母`
- `Alt+Shift+字母`  
- `Ctrl+Alt+字母`
- `Ctrl+数字`
- `Alt+数字`

注意：某些组合键可能被操作系统占用，建议避免使用常见的系统快捷键。