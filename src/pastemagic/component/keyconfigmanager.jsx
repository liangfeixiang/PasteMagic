import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CipherTool from './ciphertool';
import CipherTestComponent from './ciphertest';
// 本文件也需要知道哪些 mode 需要填充
const NEED_PADDING_MODES = new Set(['CBC', 'ECB']);
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { StorageUtils } from '../utils/storageutils';

/**
 * 秘钥配置管理组件
 * 支持多组秘钥配置的创建、编辑、删除和选择
 */
export default function KeyConfigManager({ 
  onConfigChange, 
  initialConfigs = [],
  showGenerateButton = true,
  storageKey = 'keyConfigs' // 存储键名
}) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [selectedConfig, setSelectedConfig] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [newConfigName, setNewConfigName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // 每页显示5个配置
  const [isLoading, setIsLoading] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  // 计算分页数据
  const totalPages = Math.ceil(configs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConfigs = configs.slice(startIndex, endIndex);

  // 初始化：从存储加载配置
  useEffect(() => {
    loadConfigsFromStorage();
  }, []);

  // 从存储加载配置
  const loadConfigsFromStorage = async () => {
    try {
      setIsLoading(true);
      const storedResult = await StorageUtils.getItem(storageKey);
      const storedConfigs = storedResult[storageKey];
      
      if (storedConfigs && Array.isArray(storedConfigs) && storedConfigs.length > 0) {
        setConfigs(storedConfigs);
        
        // 如果有初始配置且存储为空，则保存初始配置
        if (initialConfigs.length > 0) {
          await StorageUtils.setItem(storageKey, initialConfigs);
          setConfigs(initialConfigs);
          if (initialConfigs.length > 0) {
            setSelectedConfig(initialConfigs[0].name);
            onConfigChange?.(initialConfigs[0]);
          }
        } else {
          // 选择第一个配置
          setSelectedConfig(storedConfigs[0].name);
          onConfigChange?.(storedConfigs[0]);
        }
      } else if (initialConfigs.length > 0) {
        // 如果存储为空但有初始配置，保存初始配置
        await StorageUtils.setItem(storageKey, initialConfigs);
        setConfigs(initialConfigs);
        if (initialConfigs.length > 0) {
          setSelectedConfig(initialConfigs[0].name);
          onConfigChange?.(initialConfigs[0]);
        }
      }
    } catch (error) {
      console.error('Loading configuration failed:', error);
      toast.error('Loading configuration failed: ' + error.message);
      
      // 出错时使用初始配置
      if (initialConfigs.length > 0) {
        setConfigs(initialConfigs);
        if (initialConfigs.length > 0) {
          setSelectedConfig(initialConfigs[0].name);
          onConfigChange?.(initialConfigs[0]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 保存配置到存储
  const saveConfigsToStorage = async (newConfigs) => {
    try {
      await StorageUtils.setItem(storageKey, newConfigs);
      return true;
    } catch (error) {
      console.error('Saving configuration failed:', error);
      toast.error('Saving configuration failed: ' + error.message);
      return false;
    }
  };

  // 初始化时如果有配置，选择第一个
  useEffect(() => {
    if (configs.length > 0 && !selectedConfig) {
      setSelectedConfig(configs[0].name);
      onConfigChange?.(configs[0]);
    }
  }, [configs, selectedConfig, onConfigChange]);

  // 当选择的配置改变时通知父组件
  useEffect(() => {
    const config = configs.find(c => c.name === selectedConfig);
    if (config) {
      onConfigChange?.(config);
    }
  }, [selectedConfig, configs, onConfigChange]);

  // 添加新配置
  const addConfig = async () => {
    if (!newConfigName.trim()) {
      toast.error('请输入配置名称');
      return;
    }

    if (configs.some(c => c.name === newConfigName.trim())) {
      toast.error('配置名称已存在');
      return;
    }

    const newConfig = {
      name: newConfigName.trim(),
      algorithm: 'AES/CBC/PKCS5Padding', // 完整算法字符串
      algorithmType: 'AES', // 算法类型
      mode: 'CBC', // 加密模式
      padding: 'PKCS5Padding', // 填充方式
      key: {
        value: '',
        encoding: ['UTF8']
      },
      iv: {
        value: '',
        encoding: ['UTF8']
      },
      publicKey: {
        value: '',
        encoding: ['UTF8']
      },
      privateKey: {
        value: '',
        encoding: ['UTF8']
      },
      plainEncoding: ['UTF8'], // 明文编码默认UTF8
      cipherEncoding: ['BASE64'], // 密文编码默认BASE64
      createdAt: Date.now()
    };

    const updatedConfigs = [...configs, newConfig];
    const success = await saveConfigsToStorage(updatedConfigs);
    
    if (success) {
      setConfigs(updatedConfigs);
      setNewConfigName('');
      setEditingConfig(newConfig);
      setIsDialogOpen(true);
      toast.success('配置已创建并保存');
    }
  };

  // 编辑配置
  const editConfig = (configName) => {
    const config = configs.find(c => c.name === configName);
    if (config) {
      setEditingConfig(config);
      setIsDialogOpen(true);
    }
  };

  // 保存配置
  const saveConfig = async (updatedConfig) => {
    const updatedConfigs = configs.map(config => 
      config.name === updatedConfig.name ? updatedConfig : config
    );
    
    const success = await saveConfigsToStorage(updatedConfigs);
    
    if (success) {
      setConfigs(updatedConfigs);
      setIsDialogOpen(false);
      setEditingConfig(null);
      toast.success('配置已保存');
    }
  };

  // 删除配置
  const deleteConfig = async (configName) => {
    if (configs.length <= 1) {
      toast.error('至少需要保留一个配置');
      return;
    }

    if (confirm(`确定要删除配置 "${configName}" 吗？`)) {
      const updatedConfigs = configs.filter(c => c.name !== configName);
      const success = await saveConfigsToStorage(updatedConfigs);
      
      if (success) {
        setConfigs(updatedConfigs);
        
        // 如果删除的是当前选中的配置，选择第一个
        if (selectedConfig === configName) {
          if (updatedConfigs.length > 0) {
            setSelectedConfig(updatedConfigs[0].name);
          } else {
            setSelectedConfig('');
          }
        }
        
        toast.success('配置已删除');
      }
    }
  };

  // 生成RSA密钥对
  const generateRSAKeys = async (configToUpdate, onUpdateCallback) => {
    try {
      toast.info('正在生成RSA密钥对...');
      
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      );

      const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const publicKeyPEM = arrayBufferToPEM(publicKey, "PUBLIC KEY");

      const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const privateKeyPEM = arrayBufferToPEM(privateKey, "PRIVATE KEY");

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

      // 只更新输入框值，不自动保存
      if (onUpdateCallback && typeof onUpdateCallback === 'function') {
        onUpdateCallback(updatedConfig);
      }
      
      toast.success('RSA密钥对生成成功！请手动点击保存按钮保存配置');
    } catch (error) {
      console.error('生成RSA密钥失败:', error);
      toast.error(`生成失败: ${error.message}`);
    }
  };

  // ArrayBuffer转PEM格式（去除头部尾部标记，只保留Base64内容）
  const arrayBufferToPEM = (buffer, type) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    // 只返回Base64内容，不包含PEM头部和尾部标记
    return base64;
  };

  // 获取当前选中的配置
  const getCurrentConfig = () => {
    return configs.find(c => c.name === selectedConfig) || null;
  };

  // Chrome扩展环境中的滚动处理
  useEffect(() => {
    if (!isDialogOpen) return;
    
    const handleWheel = (e) => {
      // 阻止事件冒泡到父级容器
      e.stopPropagation();
      
      // 获取当前焦点的可滚动元素
      const target = e.target;
      const scrollableParent = target.closest('[class*="overflow-y-auto"]') || 
                              target.closest('.DialogContent') || 
                              document.querySelector('.DialogContent');
      
      if (scrollableParent) {
        // 重定向滚动到正确的容器
        const delta = e.deltaY;
        scrollableParent.scrollTop += delta;
        e.preventDefault();
      }
    };
    
    // 监听对话框内的wheel事件
    const dialogContent = document.querySelector('.DialogContent');
    if (dialogContent) {
      dialogContent.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (dialogContent) {
        dialogContent.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isDialogOpen]);

  return (
    <div className="space-y-4 w-full max-w-none h-full">
      {/* 加载状态指示器 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>加载配置中...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 配置选择和管理 - 占满全屏 */}
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span>🔐 秘钥配置管理</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTestPanel(!showTestPanel)}
                className={showTestPanel ? 'bg-primary text-primary-foreground' : ''}
              >
                🧪 测试面板
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setEditingConfig(null);
                      setNewConfigName('');
                    }}
                  >
                    ➕ 新建配置
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>
                      {editingConfig ? `编辑配置: ${editingConfig.name}` : '新建配置'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {editingConfig ? (
                    <ConfigEditor 
                      config={editingConfig}
                      onSave={saveConfig}
                      onDelete={deleteConfig}
                      onGenerateKeys={generateRSAKeys}
                      showGenerateButton={showGenerateButton}
                      onCancel={() => setIsDialogOpen(false)}
                    />
                  ) : (
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      <div>
                        <Label htmlFor="newConfigName">配置名称</Label>
                        <Input
                          id="newConfigName"
                          value={newConfigName}
                          onChange={(e) => setNewConfigName(e.target.value)}
                          placeholder="请输入配置名称"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={addConfig}>
                          创建
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* 测试面板 */}
          {showTestPanel && (
            <div className="mb-6 p-4 bg-muted rounded-lg border">
              <CipherTestComponent 
                configs={configs}
                selectedConfig={getCurrentConfig()}
                showConfigSelector={false}
                className="mb-4"
              />
            </div>
          )}
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold">配置列表</h3>
              <div className="text-sm text-muted-foreground">
                共 {configs.length} 个配置 {totalPages > 1 && `(第 ${currentPage}/${totalPages} 页)`} {isLoading && '(加载中...)'}
              </div>
            </div>
            
            {/* 配置表格 - 占满剩余空间 */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {currentConfigs.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-sm border-b">配置名称</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm border-b">算法类型</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm border-b">明文编码</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm border-b">密文编码</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm border-b">模式/填充</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm border-b">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentConfigs.map((config, index) => (
                      <tr 
                        key={config.name}
                        className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                          selectedConfig === config.name 
                            ? 'bg-primary/10' 
                            : ''
                        } ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
                        onClick={() => setSelectedConfig(config.name)}
                      >
                        <td className="py-3 px-4 font-medium">{config.name}</td>
                        <td className="py-3 px-4">{config.algorithmType || config.algorithm?.split('/')[0] || 'AES'}</td>
                        <td className="py-3 px-4">{config.plainEncoding?.[0] || 'UTF8'}</td>
                        <td className="py-3 px-4">{config.cipherEncoding?.[0] || 'BASE64'}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {config.algorithmType === 'RSA' || config.algorithm?.startsWith('RSA') ? (
                            'N/A'
                          ) : (() => {
                            const mode = config.mode || config.algorithm?.split('/')[1] || '';
                            if (NEED_PADDING_MODES.has(mode)) {
                              const padding = config.padding || config.algorithm?.split('/')[2] || 'PKCS5Padding';
                              return `${mode || 'CBC'} / ${padding}`;
                            }
                            return mode || (config.algorithm?.split('/')[1] || 'CBC');
                          })()
                          }
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                editConfig(config.name);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              ✏️
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConfig(config.name);
                              }}
                              disabled={configs.length <= 1}
                              className="h-8 w-8 p-0"
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无配置，请创建新配置
                </div>
              )}
            </div>
            
            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex justify-center flex-shrink-0 pt-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
          
          {selectedConfig && (
            <div className="mt-4 p-3 bg-muted rounded-lg flex-shrink-0">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  当前配置: <span className="font-medium text-foreground">{selectedConfig}</span>
                  <span className="mx-2">•</span>
                  算法: <span className="font-medium text-foreground">
                    {getCurrentConfig()?.algorithm || '未设置'}
                  </span>
                </div>
                <div>
                  明文编码: <span className="font-medium">{getCurrentConfig()?.plainEncoding?.[0] || getCurrentConfig()?.plaintextEncoding || 'UTF-8'}</span>
                  <span className="mx-2">•</span>
                  密文编码: <span className="font-medium">{getCurrentConfig()?.cipherEncoding?.[0] || getCurrentConfig()?.ciphertextEncoding || 'BASE64'}</span>
                </div>
                {getCurrentConfig()?.algorithmType !== 'RSA' && getCurrentConfig()?.algorithm !== 'RSA' && (
                  <div>
                    {(() => {
                      const cur = getCurrentConfig();
                      const mode = cur?.mode || cur?.algorithm?.split('/')[1] || '';
                      const padding = cur?.padding || cur?.algorithm?.split('/')[2] || '';
                      return (
                        <>
                          模式: <span className="font-medium">{mode || 'CBC'}</span>
                          {NEED_PADDING_MODES.has(mode) && (
                            <>
                              <span className="mx-2">•</span>
                              填充: <span className="font-medium">{padding || 'PKCS5Padding'}</span>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                 )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 配置编辑器组件
function ConfigEditor({ config, onSave, onDelete, onGenerateKeys, showGenerateButton, onCancel }) {
  // 确保配置对象具有必要的默认结构
  const normalizedConfig = {
    ...config,
    key: config.key || { value: '', encoding: ['UTF8'] },
    iv: config.iv || { value: '', encoding: ['UTF8'] },
    plainEncoding: config.plainEncoding || ['UTF8'],
    cipherEncoding: config.cipherEncoding || ['BASE64']
  };
  
  const [editedConfig, setEditedConfig] = useState(normalizedConfig);

  const handleSave = () => {
    if (!editedConfig.name.trim()) {
      toast.error('配置名称不能为空');
      return;
    }
    
    // 根据算法类型验证必要字段
    if (editedConfig.algorithm?.startsWith('RSA')) {
      if (!editedConfig.publicKey?.value?.trim() || !editedConfig.privateKey?.value?.trim()) {
        toast.error('RSA算法需要配置公钥和私钥');
        return;
      }
    } else {
      if (!editedConfig.key?.value?.trim()) {
        toast.error('对称算法需要配置密钥');
        return;
      }
    }
    
    onSave(editedConfig);
  };

  const handleDelete = () => {
    onDelete(config.name);
  };

  const handleGenerateKeys = () => {
    // 传入回调函数来更新本地状态
    onGenerateKeys(editedConfig, (updatedConfig) => {
      setEditedConfig(updatedConfig);
    });
  };

  // 更新密钥值
  const updateKeyValue = (value) => {
    setEditedConfig(prev => ({
      ...prev,
      key: {
        ...prev.key,
        value: value
      }
    }));
  };

  // 更新密钥编码
  const updateKeyEncoding = (encoding) => {
    setEditedConfig(prev => ({
      ...prev,
      key: {
        ...prev.key,
        encoding: [encoding]
      }
    }));
  };

  // 更新IV值
  const updateIvValue = (value) => {
    setEditedConfig(prev => ({
      ...prev,
      iv: {
        ...prev.iv,
        value: value
      }
    }));
  };

  // 更新IV编码
  const updateIvEncoding = (encoding) => {
    setEditedConfig(prev => ({
      ...prev,
      iv: {
        ...prev.iv,
        encoding: [encoding]
      }
    }));
  };

  // 更新明文编码
  const updatePlainEncoding = (encoding) => {
    setEditedConfig(prev => {
      // 处理复合编码：支持+号分隔的多个编码方式
      const encodings = encoding.split('+').map(enc => enc.trim()).filter(enc => enc);
      return {
        ...prev,
        plainEncoding: encodings
      };
    });
  };

  // 添加明文编码
  const addPlainEncoding = (encoding) => {
    setEditedConfig(prev => {
      const currentEncodings = prev.plainEncoding || [];
      return {
        ...prev,
        plainEncoding: [...currentEncodings, encoding]
      };
    });
  };

  // 移除明文编码
  const removePlainEncoding = (encoding) => {
    setEditedConfig(prev => {
      const currentEncodings = prev.plainEncoding || [];
      return {
        ...prev,
        plainEncoding: currentEncodings.filter(enc => enc !== encoding)
      };
    });
  };

  // 更新密文编码
  const updateCipherEncoding = (encoding) => {
    setEditedConfig(prev => {
      // 处理复合编码：支持+号分隔的多个编码方式
      const encodings = encoding.split('+').map(enc => enc.trim()).filter(enc => enc);
      return {
        ...prev,
        cipherEncoding: encodings
      };
    });
  };

  // 添加密文编码
  const addCipherEncoding = (encoding) => {
    setEditedConfig(prev => {
      const currentEncodings = prev.cipherEncoding || [];
      if (!currentEncodings.includes(encoding)) {
        return {
          ...prev,
          cipherEncoding: [...currentEncodings, encoding]
        };
      }
      return prev;
    });
  };

  // 移除密文编码
  const removeCipherEncoding = (encoding) => {
    setEditedConfig(prev => {
      const currentEncodings = prev.cipherEncoding || [];
      return {
        ...prev,
        cipherEncoding: currentEncodings.filter(enc => enc !== encoding)
      };
    });
  };

  // 编码格式选项
  const encodingOptions = [
    { value: 'UTF8', label: 'UTF-8' },
    { value: 'HEX', label: 'Hex' },
    { value: 'BASE64', label: 'Base64' }
  ];

  // 明文编码选项
  const plaintextEncodingOptions = [
    { value: 'UTF8', label: 'UTF-8' },
    { value: 'ASCII', label: 'ASCII' },
    { value: 'GBK', label: 'GBK' }
  ];

  // 密文编码选项
  const ciphertextEncodingOptions = [
    { value: 'BASE64', label: 'Base64' },
    { value: 'HEX', label: 'Hex' },
    { value: 'BASE64_URLSAFE', label: 'Base64 URL Safe' }
  ];


  return (
    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
      {/* 基础配置 */}
      <div className="space-y-4">
        <div className="pb-2 border-b">
          <h3 className="text-lg font-semibold">基础配置</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="configName">配置名称 *</Label>
            <Input
              id="configName"
              value={editedConfig.name}
              onChange={(e) => setEditedConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入配置名称"
            />
          </div>
          
          <div>
            {/* 算法配置放在配置名称下面（全宽展示） */}
            <CipherTool
              initialValue={{
                // 直接传入合并字符串或分字段（CipherTool 会解析）
                algorithm: editedConfig.algorithm || '' ,
                model: editedConfig.mode || editedConfig.model || '',
                padding: editedConfig.padding || ''
              }}
              onSave={(merged) => {
                setEditedConfig(prev => {
                  const updated = {
                    ...prev,
                    algorithm: merged.algorithm === 'RSA' 
                      ? 'RSA'  // RSA算法不需要模式和填充
                      : merged.combined || `${merged.algorithm}${merged.model ? '/' + merged.model : ''}${merged.padding ? '/' + merged.padding : ''}`,
                    algorithmType: merged.algorithm || prev.algorithmType,
                    mode: merged.algorithm === 'RSA' ? '' : (merged.model || prev.mode),
                    model: merged.algorithm === 'RSA' ? '' : (merged.model || prev.model),
                    // Always use merged.padding (may be empty string) to reflect switching to non-padding modes
                    padding: merged.algorithm === 'RSA' ? '' : (merged.hasOwnProperty('padding') ? merged.padding : prev.padding)
                  };
                  if (typeof onSave === 'function') onSave(updated);
                  return updated;
                });
                toast.success('算法设置已应用并保存');
              }}
              onChange={(merged) => {
                setEditedConfig(prev => ({
                  ...prev,
                  algorithm: merged.algorithm === 'RSA' 
                    ? 'RSA'  // RSA算法不需要模式和填充
                    : merged.combined || `${merged.algorithm}${merged.model ? '/' + merged.model : ''}${merged.padding ? '/' + merged.padding : ''}`,
                  algorithmType: merged.algorithm || prev.algorithmType,
                  mode: merged.algorithm === 'RSA' ? '' : (merged.model || prev.mode),
                  model: merged.algorithm === 'RSA' ? '' : (merged.model || prev.model),
                  // write merged.padding even if empty to avoid keeping old padding when switching to non-padding modes
                  padding: merged.algorithm === 'RSA' ? '' : (merged.hasOwnProperty('padding') ? merged.padding : prev.padding)
                }));
              }}
              onCancel={() => { /* 不改变 editedConfig */ }}
            />
          </div>
        </div>


      </div>

      <Separator />

      {/* 密钥配置 */}
      <div className="space-y-4">
        <div className="pb-2 border-b">
          <h3 className="text-lg font-semibold">密钥配置</h3>
        </div>
        
        {editedConfig.algorithmType === 'RSA' ? (
          <>
            <div>
              <Label>RSA 公钥 *</Label>
              <div className="flex gap-2">
                <Textarea
                  value={editedConfig.publicKey?.value || ''}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    publicKey: {
                      ...prev.publicKey,
                      value: e.target.value
                    }
                  }))}
                  placeholder="请输入RSA公钥..."
                  className="font-mono text-sm flex-1"
                  rows={6}
                />
                <Select 
                  value={editedConfig.publicKey?.encoding?.[0] || 'UTF8'} 
                  onValueChange={(encoding) => setEditedConfig(prev => ({
                    ...prev,
                    publicKey: {
                      ...prev.publicKey,
                      encoding: [encoding]
                    }
                  }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {encodingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>RSA 私钥 *</Label>
              <div className="flex gap-2">
                <Textarea
                  value={editedConfig.privateKey?.value || ''}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    privateKey: {
                      ...prev.privateKey,
                      value: e.target.value
                    }
                  }))}
                  placeholder="请输入RSA私钥..."
                  className="font-mono text-sm flex-1"
                  rows={6}
                />
                <Select 
                  value={editedConfig.privateKey?.encoding?.[0] || 'UTF8'} 
                  onValueChange={(encoding) => setEditedConfig(prev => ({
                    ...prev,
                    privateKey: {
                      ...prev.privateKey,
                      encoding: [encoding]
                    }
                  }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {encodingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {showGenerateButton && (
              <Button variant="success" onClick={handleGenerateKeys} className="w-full">
                🔑 生成RSA密钥对
              </Button>
            )}
          </>
        ) : (
          <>
            <div>
              <Label>Key *</Label>
              <div className="flex gap-2">
                <Input
                  value={editedConfig.key?.value || ''}
                  onChange={(e) => updateKeyValue(e.target.value)}
                  placeholder="请输入密钥值"
                  className="flex-1"
                />
                <Select 
                  value={editedConfig.key?.encoding?.[0] || 'HEX'} 
                  onValueChange={updateKeyEncoding}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {encodingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Initialization Vector (IV)</Label>
              <div className="flex gap-2">
                <Input
                  value={editedConfig.iv?.value || ''}
                  onChange={(e) => updateIvValue(e.target.value)}
                  placeholder="请输入初始化向量 (可选)"
                  className="flex-1"
                />
                <Select 
                  value={editedConfig.iv?.encoding?.[0] || 'UTF8'} 
                  onValueChange={updateIvEncoding}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {encodingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Encoding Settings */}
      <div className="space-y-4">
        <div className="pb-2 border-b">
          <h3 className="text-lg font-semibold">编码设置</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>明文编码</Label>
            <div className="space-y-2">
              {/* 复合编码显示 */}
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border rounded bg-gray-50">
                {editedConfig.plainEncoding?.map((encoding, index) => (
                  <div key={index} className="flex items-center bg-green-100 px-2 py-1 rounded text-sm">
                    <span>{encoding}</span>
                    <button 
                      type="button"
                      onClick={() => removePlainEncoding(encoding)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                )) || (
                  <span className="text-gray-400 text-sm">未选择编码方式</span>
                )}
              </div>
              
              {/* 编码选择器 */}
              <Select onValueChange={addPlainEncoding}>
                <SelectTrigger>
                  <SelectValue placeholder="添加编码方式" />
                </SelectTrigger>
                <SelectContent>
                  {plaintextEncodingOptions.map(option => {
                    return (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {/* 说明文字 */}
              <div className="text-xs text-gray-500">
                支持多个编码方式组合，如：BASE64+BASE64
              </div>
            </div>
          </div>
          
          <div>
            <Label>密文编码</Label>
            <div className="space-y-2">
              {/* 复合编码显示 */}
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border rounded bg-gray-50">
                {editedConfig.cipherEncoding?.map((encoding, index) => (
                  <div key={index} className="flex items-center bg-blue-100 px-2 py-1 rounded text-sm">
                    <span>{encoding}</span>
                    <button 
                      type="button"
                      onClick={() => removeCipherEncoding(encoding)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                )) || (
                  <span className="text-gray-400 text-sm">未选择编码方式</span>
                )}
              </div>
              
              {/* 编码选择器 */}
              <Select onValueChange={addCipherEncoding}>
                <SelectTrigger>
                  <SelectValue placeholder="添加编码方式" />
                </SelectTrigger>
                <SelectContent>
                  {ciphertextEncodingOptions.map(option => {
                    const isSelected = editedConfig.cipherEncoding?.includes(option.value);
                    return (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={isSelected}
                      >
                        {option.label}{isSelected ? ' (已添加)' : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {/* 说明文字 */}
              <div className="text-xs text-gray-500">
                支持多个编码方式组合，如：BASE64+HEX+URLSAFE
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">编码说明</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>明文编码</strong>: 输入文本的字符编码格式</li>
            <li>• <strong>密文编码</strong>: 加密后的输出编码格式</li>
            <li>• <strong>密钥/IV编码</strong>: 密钥和初始化向量的存储格式</li>
          </ul>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between sticky bottom-0 bg-background pt-4 pb-2">
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            🗑️ 删除配置
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { if (typeof onCancel === 'function') onCancel(); }}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存配置
          </Button>
        </div>
      </div>
    </div>
  );
}