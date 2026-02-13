import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CipherUtils } from '../utils/cipherutils';

/**
 * 加密解密测试组件
 * 用于测试各种加密算法和秘钥配置的有效性
 */
export default function CipherTestComponent({ 
  configs = [], 
  selectedConfig = null,
  className = "",
  showConfigSelector = true 
}) {
  const [testText, setTestText] = useState('Hello World! 测试加密解密功能');
  const [encryptResult, setEncryptResult] = useState('');
  const [decryptResult, setDecryptResult] = useState('');
  const [testConfig, setTestConfig] = useState(selectedConfig?.name || (configs[0]?.name || ''));
  const [isTesting, setIsTesting] = useState(false);

  // 获取当前选中的配置
  const getCurrentConfig = useCallback(() => {
    if (!testConfig) return null;
    return configs.find(c => c.name === testConfig) || null;
  }, [configs, testConfig]);

  // 执行加密测试
  const handleEncrypt = async () => {
    const config = getCurrentConfig();
    if (!config) {
      toast.error('请选择有效的配置');
      return;
    }

    if (!testText.trim()) {
      toast.error('请输入测试文本');
      return;
    }

    setIsTesting(true);
    try {
      // 检查模式支持
      const mode = config.mode || config.algorithm?.split('/')[1] || 'CBC';
      const supportedModes = ['CBC', 'ECB', 'CFB', 'OFB', 'CTR'];
      
      if (!supportedModes.includes(mode.toUpperCase())) {
        throw new Error(`不支持的加密模式: ${mode}。支持的模式: ${supportedModes.join(', ')}`);
      }
      
      // 适配配置格式
      const adaptedConfig = adaptConfigForCipher(config);
      const result = CipherUtils.encrypt(testText, adaptedConfig);
      setEncryptResult(result);
      toast.success('加密成功');
      
      // 如果已经有解密结果，重新验证一致性
      if (decryptResult) {
        const isMatch = normalizeString(decryptResult) === normalizeString(testText);
        console.log('重新验证结果一致性:', isMatch);
      }
    } catch (error) {
      console.error('Encryption failed:', error);
      toast.error(`加密失败: ${error.message}`);
      setEncryptResult('');
    } finally {
      setIsTesting(false);
    }
  };

  // 执行解密测试
  const handleDecrypt = async () => {
    const config = getCurrentConfig();
    if (!config) {
      toast.error('请选择有效的配置');
      return;
    }

    if (!encryptResult.trim()) {
      toast.error('请先执行加密操作或输入密文');
      return;
    }

    setIsTesting(true);
    try {
      // 检查模式支持
      const mode = config.mode || config.algorithm?.split('/')[1] || 'CBC';
      const supportedModes = ['CBC', 'ECB', 'CFB', 'OFB', 'CTR'];
      
      if (!supportedModes.includes(mode.toUpperCase())) {
        throw new Error(`不支持的解密模式: ${mode}。支持的模式: ${supportedModes.join(', ')}`);
      }
      
      // 适配配置格式
      const adaptedConfig = adaptConfigForCipher(config);
      const result = CipherUtils.decrypt(encryptResult, adaptedConfig);
      setDecryptResult(result);
      
      // 验证与输入文本的一致性
      const isMatch = normalizeString(result) === normalizeString(testText);
      if (isMatch) {
        toast.success('✅ 解密成功且结果与原文一致');
      } else {
        toast.warning('⚠️ 解密成功但结果与原文不一致');
        console.log('解密结果验证 - 严格:', result === testText, ' 规范化:', isMatch);
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      toast.error(`解密失败: ${error.message}`);
      setDecryptResult('');
    } finally {
      setIsTesting(false);
    }
  };

  // 执行完整测试（加密+解密）
  const handleFullTest = async () => {
    const config = getCurrentConfig();
    if (!config) {
      toast.error('请选择有效的配置');
      return;
    }

    if (!testText.trim()) {
      toast.error('请输入测试文本');
      return;
    }

    setIsTesting(true);
    try {
      // 检查模式支持
      const mode = config.mode || config.algorithm?.split('/')[1] || 'CBC';
      const supportedModes = ['CBC', 'ECB', 'CFB', 'OFB', 'CTR'];
      
      if (!supportedModes.includes(mode.toUpperCase())) {
        throw new Error(`不支持的测试模式: ${mode}。支持的模式: ${supportedModes.join(', ')}`);
      }
      
      // 适配配置格式
      const adaptedConfig = adaptConfigForCipher(config);
      
      // 加密
      const encrypted = CipherUtils.encrypt(testText, adaptedConfig);
      setEncryptResult(encrypted);
      
      // 解密
      const decrypted = CipherUtils.decrypt(encrypted, adaptedConfig);
      setDecryptResult(decrypted);
      
      // 验证结果 - 使用更宽松的比较方式
      const isMatch = normalizeString(decrypted) === normalizeString(testText);
      
      if (isMatch) {
        toast.success('✅ 完整测试通过！加密解密结果一致');
      } else {
        toast.warning('⚠️ 测试完成，但解密结果与原文不一致');
        // 输出详细调试信息
        console.log('🔍 调试信息:');
        console.log('原文:', JSON.stringify(testText));
        console.log('解密结果:', JSON.stringify(decrypted));
        console.log('原文长度:', testText.length);
        console.log('解密结果长度:', decrypted.length);
        console.log('严格比较结果:', decrypted === testText);
        console.log('规范化比较结果:', isMatch);
        
        // 字符级别的比较
        if (testText.length === decrypted.length) {
          for (let i = 0; i < testText.length; i++) {
            if (testText.charCodeAt(i) !== decrypted.charCodeAt(i)) {
              console.log(`字符差异位置 ${i}: 原文=${testText.charCodeAt(i)}('${testText[i]}'), 解密=${decrypted.charCodeAt(i)}('${decrypted[i]}')`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Full test failed:', error);
      toast.error(`测试失败: ${error.message}`);
      setEncryptResult('');
      setDecryptResult('');
    } finally {
      setIsTesting(false);
    }
  };

  // 字符串规范化函数 - 用于比较前的预处理
  const normalizeString = (str) => {
    if (typeof str !== 'string') return '';
    // 移除首尾空白，标准化换行符
    return str.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  };

  // 配置格式适配函数
  const adaptConfigForCipher = (config) => {
    // 如果是RSA算法，需要将 publicKey/privateKey 字符串转换为对象格式
    if (config.algorithm?.startsWith('RSA') || config.algorithmType === 'RSA') {
      return {
        ...config,
        publicKey:config.publicKey|| {value:  '', encoding: ['UTF8']},
        privateKey: config.privateKey|| {value:  '', encoding: ['UTF8']},
      };
    }
    
    // 对于对称算法，确保 key 和 iv 格式正确
    return {
      ...config,
      key: config.key || { value: '', encoding: ['HEX'] },
      iv: config.iv || { value: '', encoding: ['UTF8'] }
    };
  };

  // 边界情况测试函数
  const testEdgeCases = async () => {
    const edgeCases = [
      'Hello World!',
      '中文测试',
      'Special chars: !@#$%^&*()',
      'Newline\ntest',
      'Tab\ttest',
      'Mixed 中英文 test',
      '   Leading spaces',
      'Trailing spaces   ',
      'Multiple   spaces   between',
      '',
      'a',
      '1234567890'
    ];
    
    const config = getCurrentConfig();
    if (!config) {
      toast.error('请选择有效的配置');
      return;
    }
    
    setIsTesting(true);
    toast.info('开始边界测试...');
    
    const results = [];
    const adaptedConfig = adaptConfigForCipher(config);
    
    for (const testCase of edgeCases) {
      try {
        const encrypted = CipherUtils.encrypt(testCase, adaptedConfig);
        const decrypted = CipherUtils.decrypt(encrypted, adaptedConfig);
        const isMatch = normalizeString(decrypted) === normalizeString(testCase);
        
        results.push({
          input: testCase,
          output: decrypted,
          match: isMatch,
          strictMatch: decrypted === testCase
        });
        
        console.log(`测试 '${testCase}': ${isMatch ? '✅' : '❌'}`);
      } catch (error) {
        results.push({
          input: testCase,
          error: error.message,
          match: false
        });
        console.error(`测试 '${testCase}' 失败:`, error.message);
      }
    }
    
    const successCount = results.filter(r => r.match).length;
    const totalCount = results.length;
    
    toast[successCount === totalCount ? 'success' : 'warning'](
      `边界测试完成: ${successCount}/${totalCount} 通过`
    );
    
    console.table(results);
    setIsTesting(false);
  };

  // 清空结果
  const handleClear = () => {
    setEncryptResult('');
    setDecryptResult('');
  };

  // 配置发生变化时更新测试配置
  React.useEffect(() => {
    if (selectedConfig && configs.some(c => c.name === selectedConfig.name)) {
      setTestConfig(selectedConfig.name);
    }
  }, [selectedConfig, configs]);

  const currentConfig = getCurrentConfig();

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔐 加密解密测试
            {currentConfig && (
              <span className="text-sm font-normal text-muted-foreground">
                (当前配置: {currentConfig.name})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 配置选择器 */}
          {showConfigSelector && configs.length > 0 && (
            <div className="space-y-2">
              <Label>选择测试配置</Label>
              <Select value={testConfig} onValueChange={setTestConfig}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择配置" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map(config => (
                    <SelectItem key={config.name} value={config.name}>
                      <div className="flex items-center gap-2">
                        <span>{config.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({config.algorithmType || config.algorithm?.split('/')[0] || 'AES'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentConfig && (
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  <div>算法: {currentConfig.algorithm || '未设置'}</div>
                  <div>明文编码: {currentConfig.plainEncoding?.[0] || 'UTF8'}</div>
                  <div>密文编码: {currentConfig.cipherEncoding?.[0] || 'BASE64'}</div>
                  {currentConfig.algorithmType !== 'RSA' && (
                    <div>
                      模式: {currentConfig.mode || currentConfig.algorithm?.split('/')[1] || 'CBC'}
                      {currentConfig.padding && ` / ${currentConfig.padding}`}
                    </div>
                  )}
                  {/* GCM 模式特殊提示 */}
                  {((currentConfig.mode || currentConfig.algorithm?.split('/')[1] || '').toUpperCase() === 'GCM') && (
                    <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
                      ⚠️ GCM 模式提示：此模式包含认证标签，确保密文完整性验证
                    </div>
                  )}
                  {/* 调试信息 */}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">🔍 调试信息</summary>
                    <pre className="text-xs mt-1 p-2 bg-background rounded overflow-x-auto">
{JSON.stringify({
  name: currentConfig.name,
  algorithm: currentConfig.algorithm,
  algorithmType: currentConfig.algorithmType,
  mode: currentConfig.mode,
  padding: currentConfig.padding,
  publicKey: typeof currentConfig.publicKey === 'string' ? 
    `${currentConfig.publicKey.substring(0, 50)}...` : currentConfig.publicKey,
  privateKey: typeof currentConfig.privateKey === 'string' ? 
    `${currentConfig.privateKey.substring(0, 50)}...` : currentConfig.privateKey,
  key: currentConfig.key,
  iv: currentConfig.iv
}, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* 测试输入区域 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="testText">测试文本</Label>
              <Textarea
                id="testText"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="请输入要测试的文本..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleEncrypt} 
                disabled={isTesting || !currentConfig}
                variant="secondary"
              >
                {isTesting ? '⏳ 加密中...' : '🔒 加密'}
              </Button>
              
              <Button 
                onClick={handleDecrypt} 
                disabled={isTesting || !currentConfig}
                variant="secondary"
              >
                {isTesting ? '⏳ 解密中...' : '🔓 解密'}
              </Button>
              
              <Button 
                onClick={handleFullTest} 
                disabled={isTesting || !currentConfig}
                variant="default"
              >
                {isTesting ? '⏳ 测试中...' : '🧪 完整测试'}
              </Button>
              
              <Button 
                onClick={testEdgeCases} 
                disabled={isTesting || !currentConfig}
                variant="outline"
                size="sm"
              >
                🧪 边界测试
              </Button>
              
              <Button 
                onClick={handleClear} 
                variant="outline"
                disabled={!encryptResult && !decryptResult}
              >
                🧹 清空结果
              </Button>
            </div>
          </div>

          {/* 结果显示区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 加密结果 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                🔒 加密结果
                {encryptResult && (
                  <span className="text-xs text-green-600">✓ 已加密</span>
                )}
              </Label>
              <Textarea
                value={encryptResult}
                readOnly
                placeholder="加密结果将显示在这里..."
                rows={4}
                className="font-mono text-sm bg-muted"
              />
            </div>

            {/* 解密结果 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                🔓 解密结果
                {decryptResult && (
                  <span className="text-xs text-green-600">✓ 已解密</span>
                )}
              </Label>
              <Textarea
                value={decryptResult}
                readOnly
                placeholder="解密结果将显示在这里..."
                rows={4}
                className="font-mono text-sm bg-muted"
              />
              
              {/* 结果对比 */}
              {decryptResult && testText && (
                <div className={`text-sm p-2 rounded ${
                  normalizeString(decryptResult) === normalizeString(testText) 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {normalizeString(decryptResult) === normalizeString(testText) 
                    ? '✅ 解密结果与原文一致' 
                    : '❌ 解密结果与原文不一致'
                  }
                  {/* 详细比较信息 */}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">🔍 详细比较</summary>
                    <div className="text-xs mt-1 space-y-1">
                      <div>严格比较: {decryptResult === testText ? '✅ 相等' : '❌ 不相等'}</div>
                      <div>规范化比较: {normalizeString(decryptResult) === normalizeString(testText) ? '✅ 相等' : '❌ 不相等'}</div>
                      <div>原文长度: {testText.length} 字符</div>
                      <div>解密结果长度: {decryptResult.length} 字符</div>
                      <div>原文(前50字符): "{testText.substring(0, 50)}{testText.length > 50 ? '...' : ''}"</div>
                      <div>解密结果(前50字符): "{decryptResult.substring(0, 50)}{decryptResult.length > 50 ? '...' : ''}"</div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>

          {/* 测试统计信息 */}
          {encryptResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-muted p-3 rounded">
                <div className="text-muted-foreground">原文长度</div>
                <div className="font-medium">{testText.length} 字符</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="text-muted-foreground">密文长度</div>
                <div className="font-medium">{encryptResult.length} 字符</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="text-muted-foreground">压缩率</div>
                <div className="font-medium">
                  {Math.round((encryptResult.length / testText.length) * 100)}%
                </div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="text-muted-foreground">测试状态</div>
                <div className="font-medium text-green-600">✓ 完成</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}