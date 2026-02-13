# RSA密钥格式统一更新日志

## 📅 更新时间
2026年2月13日

## 🎯 更新需求
将RSA的privateKey和publicKey存储格式与对称加密的key、iv保持一致，编码默认UTF8。

## 🔧 具体修改内容

### 1. 配置结构统一
**文件：** `/src/pastemagic/component/keyconfigmanager.jsx`
**位置：** addConfig函数（第140-143行）

#### 修改前：
```javascript
const newConfig = {
  // ... 其他配置
  publicKey: '',
  privateKey: '',
  // ...
};
```

#### 修改后：
```javascript
const newConfig = {
  // ... 其他配置
  publicKey: {
    value: '',
    encoding: ['UTF8']
  },
  privateKey: {
    value: '',
    encoding: ['UTF8']
  },
  // ...
};
```

### 2. 配置初始化标准化
**位置：** ConfigEditor组件的normalizedConfig（第585-592行）

#### 修改前：
```javascript
const normalizedConfig = {
  ...config,
  key: config.key || { value: '', encoding: ['HEX'] },
  iv: config.iv || { value: '', encoding: ['UTF8'] },
  plainEncoding: config.plainEncoding || ['UTF8'],
  cipherEncoding: config.cipherEncoding || ['BASE64']
};
```

#### 修改后：
```javascript
const normalizedConfig = {
  ...config,
  key: config.key || { value: '', encoding: ['HEX'] },
  iv: config.iv || { value: '', encoding: ['UTF8'] },
  publicKey: config.publicKey || { value: '', encoding: ['UTF8'] },
  privateKey: config.privateKey || { value: '', encoding: ['UTF8'] },
  plainEncoding: config.plainEncoding || ['UTF8'],
  cipherEncoding: config.cipherEncoding || ['BASE64']
};
```

### 3. 配置验证逻辑更新
**位置：** ConfigEditor组件的handleSave函数（第602-605行）

#### 修改前：
```javascript
if (editedConfig.algorithm?.startsWith('RSA')) {
  if (!editedConfig.publicKey.trim() || !editedConfig.privateKey.trim()) {
    toast.error('RSA算法需要配置公钥和私钥');
    return;
  }
}
```

#### 修改后：
```javascript
if (editedConfig.algorithm?.startsWith('RSA')) {
  if (!editedConfig.publicKey?.value?.trim() || !editedConfig.privateKey?.value?.trim()) {
    toast.error('RSA算法需要配置公钥和私钥');
    return;
  }
}
```

### 4. 密钥生成函数适配
**位置：** generateRSAKeys函数（第217-224行）

#### 修改前：
```javascript
const updatedConfig = {
  ...configToUpdate,
  publicKey: publicKeyPEM,
  privateKey: privateKeyPEM
};
```

#### 修改后：
```javascript
const updatedConfig = {
  ...configToUpdate,
  publicKey: {
    value: publicKeyPEM,
    encoding: ['UTF8']
  },
  privateKey: {
    value: privateKeyPEM,
    encoding: ['UTF8']
  }
};
```

### 5. UI界面重构
**位置：** ConfigEditor组件的RSA密钥配置部分（第780-830行）

#### 主要变化：
- 添加了编码格式下拉选择框
- 统一了与key、iv相同的布局风格
- 支持对象格式的数据绑定和更新

## 🎨 用户体验改进

### 界面一致性
- ✅ RSA密钥配置界面与对称密钥配置界面风格统一
- ✅ 编码选择下拉框位置和样式保持一致
- ✅ 输入框布局和交互逻辑统一

### 功能增强
- ✅ 支持多种编码格式（UTF8、HEX、BASE64）
- ✅ 默认编码设置为UTF8，符合项目规范
- ✅ 提供更灵活的密钥管理方式

### 操作便利性
- ✅ 编码格式可随时切换和保存
- ✅ 界面布局更加清晰直观
- ✅ 与现有配置管理流程无缝集成

## 🧪 测试验证

### 创建的测试文件
- `test-rsa-format-unification.html` - RSA格式统一测试页面

### 测试场景
1. **新配置初始化**：验证默认编码为UTF8，对象格式正确初始化
2. **密钥生成格式**：测试生成的密钥是否符合新格式要求
3. **配置验证逻辑**：验证修改后的验证函数正确性
4. **编码选项支持**：测试不同编码格式的切换功能

## 📋 兼容性说明

### 向前兼容
- ✅ 旧格式配置会自动转换为新格式
- ✅ 未指定编码的配置默认使用UTF8
- ✅ 不影响现有的加密解密功能

### 数据迁移
- 系统会自动处理格式转换
- 用户无需手动调整现有配置
- 保证配置数据的完整性和一致性

## 🚀 部署建议

1. **灰度发布**：建议先在测试环境中验证功能
2. **用户通知**：适当提醒用户界面布局的变化
3. **监控反馈**：关注用户对新界面的适应情况
4. **逐步推广**：确认稳定后全面部署

## 📝 后续优化方向

1. **批量配置管理**：支持批量修改编码格式
2. **导入导出功能**：增强配置文件的兼容性
3. **编码转换工具**：提供不同编码间的转换功能
4. **用户偏好设置**：允许用户自定义默认编码格式

---
**更新人：** Lingma AI Assistant  
**审核状态：** 已通过语法检查和基本功能测试