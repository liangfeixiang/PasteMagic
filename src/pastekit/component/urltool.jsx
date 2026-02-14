import React, { useState, useCallback, useEffect, useRef } from 'react';
import QRCodeComponent from './qrcode';
import { useTranslation } from '../utils/i18n';

// URL utility functions

// URL encoding
const encodeUrl = (str) => {
    try {
        return encodeURIComponent(str);
    } catch (e) {
        throw new Error('URL encoding failed: ' + e.message);
    }
};

// URL decoding
const decodeUrl = (str) => {
    try {
        return decodeURIComponent(str);
    } catch (e) {
        throw new Error('URL decoding failed: ' + e.message);
    }
};

// Detect URL format
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Detect if it's URL encoded format
const isUrlEncoded = (str) => {
    // Check if there are percent-encoded characters
    const urlEncodedPattern = /%[0-9A-Fa-f]{2}/;
    return urlEncodedPattern.test(str);
};

// 检测是否为Base64编码
const isBase64Encoded = (str) => {
    // Base64 字符串只能包含 A-Z, a-z, 0-9, +, /, = 这些字符，并且长度是4的倍数
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) return false;
    try {
        // 验证是否能正确解析
        const decoded = atob(str);
        return btoa(decoded) === str;
    } catch (e) {
        return false;
    }
};

export default function UrlTool({ content }) {
    const [t] = useTranslation();
    
    // Base64解码
    const decodeBase64 = (str) => {
        try {
            return atob(str);
        } catch (e) {
            throw new Error(t('components.urltool.base64_decode_failed') + ': ' + e.message);
        }
    };

    // Base64编码
    const encodeBase64 = (str) => {
        try {
            return btoa(str);
        } catch (e) {
            throw new Error(t('components.urltool.base64_encode_failed') + ': ' + e.message);
        }
    };
    
    console.log('🔗 UrlTool rendering:', {
        content: content?.substring(0, 50) + '...',
        hasContent: !!content,
        timestamp: Date.now()
    });

    // Don't display component if no content
    if (!content || content === undefined || content === null) {
        return null;
    }

    const [results, setResults] = useState({
        encoded: '',
        decoded: '',
        original: '',
        contentType: 'unknown', // 'url', 'url_encoded', 'base64', 'hex', 'other'
        decodedType: '' // Record decoding type
    });
    const [error, setError] = useState(null);
    const [qrSize, setQrSize] = useState(200);
    const debounceTimerRef = useRef(null);
    const lastProcessedContentRef = useRef('');

    console.log('🔄 URL tool state update:', { hasError: !!error });

    // Core function to process encoding/decoding
    const processContent = useCallback((inputContent = content) => {
        console.log('🚀 Executing processContent:', {
            content: inputContent?.substring(0, 50) + '...',
            timestamp: Date.now()
        });

        setError(null);
        setResults({
            encoded: '',
            decoded: '',
            original: inputContent,
            qrcode: null,
            contentType: 'unknown',
            decodedType: ''
        });

        try {
            const trimmedContent = inputContent?.trim() || '';
            if (!trimmedContent) {
                return;
            }

            const newResults = {
                original: trimmedContent
            };

            // Detect content type and process
            if (isUrlEncoded(trimmedContent)) {
                // Is URL encoded content, perform decoding
                try {
                    newResults.decoded = decodeUrl(trimmedContent);
                    newResults.contentType = 'url_encoded';
                    newResults.decodedType = 'URL Encoding';
                    
                    // Encode decoded content again for comparison
                    newResults.encoded = encodeUrl(newResults.decoded);
                } catch (e) {
                    // Decoding failed
                    setError('URL encoded content decoding failed: ' + e.message);
                    newResults.decoded = trimmedContent;
                    newResults.contentType = 'other';
                }
            } else if (isBase64Encoded(trimmedContent)) {
                // Is Base64 encoded content, perform decoding
                try {
                    newResults.decoded = decodeBase64(trimmedContent);
                    newResults.contentType = 'base64';
                    newResults.decodedType = 'Base64';
                    
                    // Encode decoded content again for comparison
                    newResults.encoded = encodeBase64(newResults.decoded);
                } catch (e) {
                    // Decoding failed
                    setError('Base64 encoded content decoding failed: ' + e.message);
                    newResults.decoded = trimmedContent;
                    newResults.contentType = 'other';
                }
            } else if (isHexEncoded(trimmedContent)) {
                // Is hexadecimal encoded content, perform decoding
                try {
                    newResults.decoded = decodeHex(trimmedContent);
                    newResults.contentType = 'hex';
                    newResults.decodedType = 'Hexadecimal';
                    
                    // Encode decoded content again for comparison
                    newResults.encoded = encodeHex(newResults.decoded);
                } catch (e) {
                    // Decoding failed
                    setError('Hexadecimal encoded content decoding failed: ' + e.message);
                    newResults.decoded = trimmedContent;
                    newResults.contentType = 'other';
                }
            } else if (isValidUrl(trimmedContent)) {
                // Is regular URL, perform encoding
                newResults.encoded = encodeUrl(trimmedContent);
                newResults.decoded = trimmedContent; // URL itself can also serve as "decoded" content
                newResults.contentType = 'url';
                newResults.decodedType = 'URL';
            } else {
                // Other content, process as plain text
                newResults.encoded = encodeUrl(trimmedContent);
                newResults.decoded = decodeUrl(trimmedContent);
                newResults.contentType = 'other';
                newResults.decodedType = 'Plain Text';
            }

            // Generate QR code content - determine QR code content based on content type
            let qrCodeContent = '';
            if (newResults.contentType === 'url_encoded' || newResults.contentType === 'base64' || newResults.contentType === 'hex') {
                // If it's various encoded URLs, use decoded content to generate QR code
                qrCodeContent = newResults.decoded;
            } else if (newResults.contentType === 'url') {
                // If it's regular URL, use original content to generate QR code
                qrCodeContent = trimmedContent;
            } else {
                // Other cases use original content
                qrCodeContent = trimmedContent;
            }

            setResults({
                ...newResults,
                qrcode: qrCodeContent
            });
        } catch (err) {
            setError(err.message);
        }
    }, [setResults, setError]); // Add necessary dependencies

    // Debounce handling for content changes
    useEffect(() => {
        console.log('🎯 Content change monitoring:', {
            content: content?.substring(0, 50) + '...',
            hasContent: !!content,
            lastProcessed: lastProcessedContentRef.current?.substring(0, 50) + '...',
            timestamp: Date.now()
        });

        if (!content || content === lastProcessedContentRef.current) {
            console.log('⚠️ Content unchanged or empty, skipping debounce processing');
            return;
        }

        console.log('🔍 Debounce triggered:', {content: content.substring(0, 50) + '...', timestamp: Date.now()});

        if (debounceTimerRef.current) {
            console.log('🧹 Clearing old timer:', debounceTimerRef.current);
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            console.log('✅ Debounce executing content change:', {
                content: content.substring(0, 50) + '...',
                timestamp: Date.now()
            });
            processContent(content);
            
            // Update last processed content
            lastProcessedContentRef.current = content;
        }, 300); // Reduce delay for faster response

        console.log('⏰ Setting new timer:', debounceTimerRef.current, 'delay: 300ms');

        return () => {
            if (debounceTimerRef.current) {
                console.log('🧹 Clearing timer on component unmount:', debounceTimerRef.current);
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [content, processContent]); // Include all necessary dependencies

    // Initial processing
    useEffect(() => {
        if (content && content !== lastProcessedContentRef.current) {
            processContent(content);
            lastProcessedContentRef.current = content;
        }
    }, [content, processContent]); // Include all necessary dependencies

    return (
        <div>
            <div className="w-full border rounded p-4 space-y-4">
                <h3 className="text-lg font-bold">Encoding/Decoding Tool</h3>
                
                {/* Error notification */}
                {error && (
                    <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
                        <strong>{t('components.urltool.processing_error')}:</strong> {error}
                    </div>
                )}

                {/* Display encoding/decoding results based on content type */}
                {(results.contentType === 'url_encoded' || results.contentType === 'base64' || results.contentType === 'hex') && (
                    // If it's encoded content, display decoding results
                    <div className="space-y-4">
                        <div className="border rounded p-3 bg-yellow-50">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm text-gray-700">📤 {results.decodedType} Decoding Results</h4>
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    🔐 Decoded
                                </span>
                            </div>
                            {results.decoded ? (
                                <div className="text-xs font-mono bg-orange-100 px-2 py-1 rounded break-all">
                                    {results.decoded}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 italic">
                                    Decoding failed or input is not encoded format
                                </div>
                            )}
                        </div>
                        
                    </div>
                )}
                
                {results.contentType === 'url' && (
                    // If it's regular URL, display encoding results
                    <div className="space-y-4">
                        <div className="border rounded p-3 bg-green-50">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm text-gray-700">📥 URL Encoding</h4>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    🌐 URL
                                </span>
                            </div>
                            {results.encoded ? (
                                <div className="text-xs font-mono bg-green-100 px-2 py-1 rounded break-all">
                                    {results.encoded}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 italic">
                                    URL has been encoded
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {results.contentType === 'other' && (
                    // If it's other content, display encoding results
                    <div className="space-y-4">
                        <div className="border rounded p-3 bg-green-50">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm text-gray-700">📥 Text Encoding</h4>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    📝 Text
                                </span>
                            </div>
                            {results.encoded ? (
                                <div className="text-xs font-mono bg-green-100 px-2 py-1 rounded break-all">
                                    {results.encoded}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 italic">
                                    Content has been URL encoded
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* QR code area - always displayed, automatically generated based on appropriate content */}
                <QRCodeComponent 
                    content={results.qrcode}
                    size={qrSize}
                    onSizeChange={setQrSize}
                    type="svg"
                />

                {/* Empty state notification */}
                {!content && (
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">🔗</div>
                        <div>{t('components.urltool.enter_content')}</div>
                        <div className="text-sm mt-1">{t('components.urltool.support_desc')}</div>
                    </div>
                )}
            </div>
        </div>
    );
}