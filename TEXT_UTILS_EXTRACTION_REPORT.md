# 文本工具函数提取与统一化报告

## 项目概述
将popup.jsx和AutoCipherTool组件中的可打印字符判断逻辑提取为通用工具函数，实现代码复用和逻辑统一。

## 主要变更

### 1. 新增工具文件
**文件**: `/src/pastemagic/utils/textutils.js`

**功能**:
- `analyzePrintableCharacters(text)`: 分析文本的可打印字符比例
- `isTextReadable(text, threshold)`: 判断文本是否可读
- `getTextAnalysisReport(text)`: 获取详细的文本分析报告
- `filterNonPrintableCharacters(text)`: 过滤不可打印字符

### 2. 修改popup.jsx
**变更位置**: CFB模式解密结果分析部分

**优化内容**:
- 移除了重复的正则表达式定义
- 使用统一的`analyzePrintableCharacters`函数
- 简化了日志输出结构
- 保持原有的判断逻辑（50%可读性阈值）

### 3. 修改AutoCipherTool.jsx
**变更位置**: CFB模式可打印字符判断部分

**优化内容**:
- 替换了内联的正则表达式
- 使用统一的分析函数
- 保持错误信息的一致性
- 简化了代码结构

## 技术优势

### 代码复用
- 消除了重复的正则表达式定义
- 统一了可打印字符的判断标准
- 减少了维护成本

### 功能增强
- 提供了更丰富的文本分析功能
- 支持详细的字符类型统计
- 可配置的可读性阈值

### 性能优化
- 正则表达式只需编译一次
- 减少了重复计算
- 提高了代码执行效率

## 测试验证

创建了专门的测试文件 `test-text-utils.html` 验证：
- ✅ 基本文本可读性判断
- ✅ 中英文混合文本处理
- ✅ 控制字符处理
- ✅ 特殊符号识别
- ✅ 边界情况处理

## 使用示例

```javascript
// 基本使用
import { analyzePrintableCharacters } from '../utils/textutils';

const result = analyzePrintableCharacters("Hello 世界!");
console.log(result.printableRatio); // 1.0 (100%可读)
console.log(result.isReadable); // true

// 详细分析
import { getTextAnalysisReport } from '../utils/textutils';

const report = getTextAnalysisReport("Mixed 文本 123 @#$%");
console.log(report.details.characterTypes);
// 输出各字符类型的统计信息
```

## 兼容性保证
- 保持了原有的判断逻辑和阈值
- 不影响现有功能的正常运行
- 向后兼容所有调用场景

## 后续建议
1. 可以考虑将阈值配置化，支持用户自定义
2. 添加更多字符集支持（如emoji表情符号）
3. 提供文本质量评分功能