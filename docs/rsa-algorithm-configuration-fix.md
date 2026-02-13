# RSA算法配置格式修复日志

## 📅 修复时间
2026年2月13日

## 🎯 问题描述
用户反馈："RSA/CBC/PKCS5Padding rsa 保存时，把模式，填充加上了，需要修改"

## 🔍 问题分析

### 错误现象
在配置保存时，RSA算法的algorithm字段被错误地设置为"RSA/CBC/PKCS5Padding"，同时mode和padding字段也被错误地填充。

### 根本原因
CipherTool组件在处理算法配置时，无论什么算法类型都会将模式和填充信息拼接到algorithm字段中，没有针对RSA算法做特殊处理。

### 技术背景
- **RSA算法特性**：非对称加密算法，使用PKCS#1标准填充，不需要CBC等模式概念
- **对称算法特性**：如AES/SM4需要明确指定模式和填充方式
- **配置格式要求**：RSA配置应该保持algorithm字段为纯"RSA"

## 🔧 修复方案

### 修改文件
`/src/pastemagic/component/keyconfigmanager.jsx`

### 具体修改

#### 1. onSave回调修改
```javascript
// 修改前
algorithm: merged.combined || `${merged.algorithm}${merged.model ? '/' + merged.model : ''}${merged.padding ? '/' + merged.padding : ''}`

// 修改后
algorithm: merged.algorithm === 'RSA' 
  ? 'RSA'  // RSA算法不需要模式和填充
  : merged.combined || `${merged.algorithm}${merged.model ? '/' + merged.model : ''}${merged.padding ? '/' + merged.padding : ''}`
```

#### 2. onChange回调修改
```javascript
// 修改前
algorithm: merged.combined || `${merged.algorithm}${merged.model ? '/' + merged.model : ''}${merged.padding ? '/' + merged.padding : ''}`

// 修改后
algorithm: merged.algorithm === 'RSA' 
  ? 'RSA'  // RSA算法不需要模式和填充
  : merged.combined || `${merged.algorithm}${merged.model ? '/' + merged.model : ''}${merged.padding ? '/' + merged.padding : ''}`
```

#### 3. 相关字段清理
```javascript
// 同时清理mode和padding字段
mode: merged.algorithm === 'RSA' ? '' : (merged.model || prev.mode),
padding: merged.algorithm === 'RSA' ? '' : (merged.hasOwnProperty('padding') ? merged.padding : prev.padding)
```

## ✅ 修复效果

### 配置格式标准化
- **RSA配置**：algorithm="RSA"，mode=""，padding=""
- **对称配置**：保持原有格式不变（如AES/CBC/PKCS5Padding）

### 用户体验改善
- ✅ 界面操作逻辑保持一致
- ✅ 避免因配置格式错误导致的解密问题
- ✅ 提升系统配置的准确性和稳定性

### 兼容性保证
- ✅ 不影响现有对称算法配置
- ✅ 向后兼容已有的RSA配置
- ✅ 算法切换时字段自动清理

## 🧪 测试验证

### 创建的测试文件
- `test-rsa-algorithm-fix.html` - RSA算法配置修复测试页面

### 测试场景
1. **RSA配置保存**：验证algorithm字段为纯"RSA"
2. **对称算法配置**：确保原有功能不受影响
3. **算法切换测试**：验证RSA↔对称算法切换时的字段清理

## 📋 技术要点

### RSA算法特点
- 使用PKCS#1标准填充（系统内部处理）
- 不需要显式的模式参数
- algorithm字段应保持纯净

### 实现机制
- 基于算法类型判断进行条件处理
- 保持向后兼容性
- 配置格式标准化

## 🚀 部署建议

1. **灰度发布**：建议先在测试环境验证
2. **监控重点**：关注RSA配置的保存和使用情况
3. **用户沟通**：适当说明配置格式的规范化调整
4. **回滚准备**：准备好快速回滚方案

## 📝 后续优化

1. **配置验证**：添加更严格的配置格式验证
2. **用户引导**：在UI中明确区分对称和非对称算法的特点
3. **文档更新**：完善配置管理相关文档说明

---
**修复人：** Lingma AI Assistant  
**审核状态：** 已通过语法检查和基本功能测试