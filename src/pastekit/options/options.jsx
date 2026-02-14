import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { StorageUtils } from '../utils/storageutils.js';
import KeyConfigManager from '../component/keyconfigmanager.jsx';
import CipherTestComponent from '../component/ciphertest.jsx';
import AboutComponent from '../component/about.jsx';
import LanguageSwitcher from '../component/languageswitcher.jsx';
import { useTranslation, preloadTranslations } from '../utils/i18n';

// Menu items configuration (will be translated dynamically)
const getMenuItems = (t) => [
  { id: 'key-config', label: t('options.sidebar.key_config'), icon: 'key' },
  { id: 'encryption-test', label: t('options.sidebar.encryption_test'), icon: 'test-tube' },
  { id: 'about', label: t('options.sidebar.about'), icon: 'info' }
];

export default function OptionsPage() {
  const [t, currentLanguage] = useTranslation();
  const [activeSection, setActiveSection] = useState('key-config');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [testData, setTestData] = useState({
    text: 'Hello World! 这是一个加密解密测试。',
    algorithm: 'RSA',
    encrypted: '',
    decrypted: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // 确保翻译数据已预加载
  useEffect(() => {
    const initializeTranslations = async () => {
      try {
        await preloadTranslations();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize translations:', error);
        setIsLoading(false);
      }
    };
    
    initializeTranslations();
  }, []);

  // 页面加载时获取保存的配置
  useEffect(() => {
    loadSavedConfigs();
  }, []);

  // Check browser support when component mounts
  useEffect(() => {
    if (typeof TextEncoder === 'undefined' || typeof TextDecoder === 'undefined') {
      console.warn('Browser does not support TextEncoder/TextDecoder, some features may be limited');
    }
  }, []);

  // Load saved configurations
  const loadSavedConfigs = async () => {
    try {
      const result = await StorageUtils.getItem('keyConfigs');
      if (result.keyConfigs && Array.isArray(result.keyConfigs)) {
        setSavedConfigs(result.keyConfigs);
        if (result.keyConfigs.length > 0) {
          setCurrentConfig(result.keyConfigs[0]);
        }
        toast.info('Configuration loaded successfully');
      } else {
        // Create default configuration if none exists
        const defaultConfig = [{
          name: 'Default Configuration',
          type: 'RSA',
          publicKey: '',
          privateKey: '',
          aesKey: '',
          aesIv: '',
          createdAt: Date.now()
        }];
        setSavedConfigs(defaultConfig);
        setCurrentConfig(defaultConfig[0]);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.error(`Load failed: ${error.message}`);
    }
  };

  // Save all configurations
  const saveAllConfigs = async (configs) => {
    try {
      await StorageUtils.setItem('keyConfigs', configs);
      setSavedConfigs(configs);
      toast.success('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error(`Save failed: ${error.message}`);
    }
  };

  // Handle configuration changes
  const handleConfigChange = (config) => {
    setCurrentConfig(config);
  };





  // UTF-8 safe Base64 encoding
  const utf8ToBase64 = (str) => {
    // First convert string to UTF-8 byte array
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    // Convert byte array to string, then perform Base64 encoding
    const binaryString = String.fromCharCode(...bytes);
    return btoa(binaryString);
  };

  // UTF-8 safe Base64 decoding
  const base64ToUtf8 = (base64) => {
    // First perform Base64 decoding
    const binaryString = atob(base64);
    // Convert binary string to byte array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    // Use TextDecoder to decode to UTF-8 string
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  };



  // Encryption test
  const encryptTest = async () => {
    if (!testData.text.trim()) {
      toast.error('Please enter test text');
      return;
    }

    try {
      let ciphertext;
      
      switch (testData.algorithm) {
        case 'RSA':
          if (!currentConfig?.publicKey) {
            toast.error('Please configure RSA public key first');
            return;
          }
          // Use UTF-8 safe Base64 encoding
          ciphertext = utf8ToBase64(testData.text);
          break;
          
        case 'AES/CBC/PKCS5Padding':
        case 'AES/ECB/PKCS5Padding':
          if (!currentConfig?.aesKey) {
            toast.error('Please configure AES key first');
            return;
          }
          // Simple XOR encryption simulation
          ciphertext = simpleXorEncrypt(testData.text, currentConfig.aesKey);
          break;
          
        default:
          throw new Error(`Unsupported algorithm: ${testData.algorithm}`);
      }

      setTestData(prev => ({
        ...prev,
        encrypted: ciphertext
      }));
      
      toast.success(`${testData.algorithm} encryption successful!`);
    } catch (error) {
      console.error('Encryption failed:', error);
      toast.error(`Encryption failed: ${error.message}`);
    }
  };

  // Decryption test
  const decryptTest = async () => {
    if (!testData.encrypted.trim()) {
      toast.error('Please enter ciphertext');
      return;
    }

    try {
      let plaintext;
      
      switch (testData.algorithm) {
        case 'RSA':
          if (!currentConfig?.privateKey) {
            toast.error('Please configure RSA private key first');
            return;
          }
          // Use UTF-8 safe Base64 decoding
          plaintext = base64ToUtf8(testData.encrypted);
          break;
          
        case 'AES/CBC/PKCS5Padding':
        case 'AES/ECB/PKCS5Padding':
          if (!currentConfig?.aesKey) {
            toast.error('Please configure AES key first');
            return;
          }
          // Simple XOR decryption simulation
          plaintext = simpleXorDecrypt(testData.encrypted, currentConfig.aesKey);
          break;
          
        default:
          throw new Error(`Unsupported algorithm: ${testData.algorithm}`);
      }

      setTestData(prev => ({
        ...prev,
        decrypted: plaintext
      }));
      
      toast.success(`${testData.algorithm} decryption successful!`);
    } catch (error) {
      console.error('Decryption failed:', error);
      toast.error(`Decryption failed: ${error.message}`);
    }
  };

  // Full test
  const fullTest = async () => {
    if (!testData.text.trim()) {
      toast.error('Please enter test text');
      return;
    }

    try {
      toast.info(`Executing ${testData.algorithm} full test...`);
      
      // Execute encryption
      await encryptTest();
      
      // Wait for state update
      setTimeout(async () => {
        // Execute decryption
        await decryptTest();
        
        // Verify results
        setTimeout(() => {
          if (testData.text === testData.decrypted) {
            toast.success(`${testData.algorithm} full test passed!`);
          } else {
            toast.error(`${testData.algorithm} test failed! Original text does not match decrypted result.`);
          }
        }, 100);
      }, 100);
      
    } catch (error) {
      console.error('Full test failed:', error);
      toast.error(`Full test failed: ${error.message}`);
    }
  };

  // Simple XOR encryption function (UTF-8 support)
  const simpleXorEncrypt = (text, key) => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return utf8ToBase64(result);
  };

  const simpleXorDecrypt = (encrypted, key) => {
    const text = base64ToUtf8(encrypted);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  };

  // URL-safe Base64 encoding (compliant with project specifications)
  const base64ToUrlSafe = (base64Str) => {
    return base64Str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const urlSafeToBase64 = (urlSafeStr) => {
    let base64Str = urlSafeStr.replace(/-/g, '+').replace(/_/g, '/');
    // Add missing padding characters
    while (base64Str.length % 4 !== 0) {
      base64Str += '=';
    }
    return base64Str;
  };

  // 渲染不同页面内容
  const renderContent = () => {
    switch (activeSection) {
      case 'key-config':
        return (
          <div className="space-y-6 h-full w-full">
            {/* Main configuration management area - occupies more space */}
            <div className="w-full">
              <KeyConfigManager
                initialConfigs={savedConfigs}
                onConfigChange={handleConfigChange}
                showGenerateButton={true}
              />
            </div>
          </div>
        );

      case 'encryption-test':
        return (
          <div className="space-y-6 h-full">
            <CipherTestComponent 
              configs={savedConfigs}
              selectedConfig={currentConfig}
              className="h-full"
            />
          </div>
        );

      case 'about':
        return <AboutComponent />;

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        {/* 左侧菜单栏 */}
        <Sidebar className="w-64 border-r flex-shrink-0 relative z-10">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="p-4 border-b bg-background">
                  <h2 className="text-xl font-bold">PasteMagic</h2>
                  <p className="text-sm text-muted-foreground">Settings Center</p>
                  {/* Language Switcher - 一行展示，靠右边 */}
                  <div className="mt-3 pt-2 border-t">
                    <LanguageSwitcher 
                      variant="horizontal" 
                      className="justify-end"
                    />
                  </div>
                </div>
                <SidebarMenu>
                  {getMenuItems(t).map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeSection === item.id}
                        onClick={() => setActiveSection(item.id)}
                        className="justify-start px-4 py-2"
                      >
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto relative w-full">
          <div className="p-4 min-h-full">
            <div className="w-full">
              {renderContent()}
            </div>
          </div>
        </div>

        <Toaster />
      </div>
    </SidebarProvider>
  );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<OptionsPage />);