'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, RefreshCw, Sliders, Zap, Shield, Sparkles, 
  Search, Check, Clock, ChevronRight, Info, HardDrive, Filter, MessageSquare, Terminal
} from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  isFree: boolean;
  pricing: { prompt: number; completion: number };
  description: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
}

export const Playground: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('opencode/deepseek-v4-flash-free');
  const [modelFilter, setModelFilter] = useState<'all' | 'free'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');

  const [systemPrompt, setSystemPrompt] = useState<string>('You are Codilore, a high-performance assistant routing requests via OpenCode Zen.');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am Codilore. Select any model from the list on the left and ask me anything.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [lastLatency, setLastLatency] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        setModels(data);
        if (data.length > 0) setSelectedModelId(data[0].id);
      })
      .catch(err => console.error(err));

    fetch('/api/keys')
      .then(res => res.json())
      .then(keys => {
        setApiKeys(keys);
        if (keys.length > 0) setSelectedKey(keys[0].key);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const selectedModel = models.find(m => m.id === selectedModelId) || {
    id: selectedModelId,
    name: selectedModelId.replace('opencode/', ''),
    provider: 'OpenCode Zen',
    contextLength: 64000,
    isFree: true,
    description: 'Selected model'
  };

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = modelFilter === 'all' || (modelFilter === 'free' && m.isFree);
    return matchesSearch && matchesType;
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: timeStr };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsGenerating(true);

    const startTime = Date.now();
    const assistantMessage: Message = { role: 'assistant', content: '', timestamp: timeStr };
    setMessages([...updatedMessages, assistantMessage]);

    try {
      const payload = {
        model: selectedModelId,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature,
        max_tokens: maxTokens,
        stream: true
      };

      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${selectedKey || apiKeys[0]?.key || 'sk-loreder-master-key'}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('Failed to read response stream');

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.replace('data: ', '');
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
              accumulatedContent += deltaContent;

              setMessages(prev => {
                const next = [...prev];
                if (next.length > 0) {
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: timeStr
                  };
                }
                return next;
              });
            } catch (pErr) {
              // Raw chunk streaming
            }
          }
        }
      }

      setLastLatency(Date.now() - startTime);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => {
        const next = [...prev];
        if (next.length > 0) {
          next[next.length - 1] = {
            role: 'assistant',
            content: `⚠️ Request Error: ${err.message || 'Rate limit reached on OpenCode Zen. Please try again in 15 seconds.'}`,
            timestamp: timeStr
          };
        }
        return next;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-57px)] bg-[#09090b] text-zinc-200 overflow-hidden font-sans">
      
      {/* 1. SECONDARY LEFT PANEL: Model Selector & Search (Reference UI Column 2) */}
      <div className="w-72 bg-[#121215] border-r border-zinc-800/80 flex flex-col flex-shrink-0">
        
        {/* Sub-header & Search Bar */}
        <div className="p-3.5 border-b border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-teal-400" />
              Models Registry
            </h2>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
              {models.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/60 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex space-x-1.5">
            <button
              onClick={() => setModelFilter('all')}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-colors ${
                modelFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              All ({models.length})
            </button>
            <button
              onClick={() => setModelFilter('free')}
              className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-colors ${
                modelFilter === 'free'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              Free Tier ({models.filter(m => m.isFree).length})
            </button>
          </div>
        </div>

        {/* Model Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
          {filteredModels.map((m) => {
            const isSelected = m.id === selectedModelId;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedModelId(m.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#1c1c21] border-l-2 border-teal-500'
                    : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-zinc-200 truncate max-w-[170px]">
                    {m.name}
                  </span>
                  {m.isFree && (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      FREE
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span className="truncate max-w-[150px]">{m.provider}</span>
                  <span>{(m.contextLength / 1024).toFixed(0)}k</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN CENTER WORKSPACE: Conversation Window (Reference UI Column 3) */}
      <div className="flex-1 flex flex-col bg-[#09090b] relative">
        
        {/* Main Conversation Top Bar */}
        <div className="h-13 px-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#121215]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100 flex items-center">
                {selectedModel.name}
                <span className="ml-2 text-[10px] font-normal text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  OpenCode Zen
                </span>
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono truncate max-w-md">{selectedModel.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
              title="Clear Conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Conversation Stream Window */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="text-center my-2">
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  AI
                </div>
              )}

              <div className="max-w-[75%] space-y-1">
                <div className="flex items-center space-x-2 px-1">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {msg.role === 'user' ? 'You' : selectedModel.name}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-teal-600/90 text-white rounded-tr-none shadow-md shadow-teal-950'
                      : 'bg-[#141417] text-zinc-200 border border-zinc-800 rounded-tl-none font-sans'
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex items-center text-teal-400 animate-pulse">
                      <Zap className="w-3 h-3 mr-1.5" /> Streaming response from OpenCode Zen...
                    </span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Rich Input Box (Reference UI Bottom Command Panel) */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#121215] space-y-2">
          <form onSubmit={handleSendMessage} className="relative">
            <textarea
              rows={2}
              placeholder="Enter message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isGenerating}
              className="w-full bg-[#18181b] border border-zinc-800 focus:border-teal-500 text-zinc-100 placeholder-zinc-500 rounded-xl p-3 pr-24 text-xs focus:outline-none resize-none transition-colors"
            />
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-500/20"
              >
                <span>Send</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Action Keyboard Hints Footer Bar */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
            <div className="flex space-x-4">
              <span>Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Enter</kbd> to send</span>
              <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Shift + Enter</kbd> new line</span>
            </div>
            {lastLatency && (
              <span className="text-teal-400 font-semibold">Latency: {lastLatency}ms</span>
            )}
          </div>
        </div>

      </div>

      {/* 3. RIGHT DETAILS INSPECTOR PANEL (Reference UI Column 4) */}
      <div className="w-80 bg-[#121215] border-l border-zinc-800/80 p-4 overflow-y-auto space-y-5 flex-shrink-0">
        <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-2">
          Model & Session Details
        </h3>

        {/* Section: Model Details */}
        <div className="space-y-2.5 text-xs">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Model Meta</span>
          
          <div className="bg-[#18181b] p-3 rounded-xl border border-zinc-800/80 space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">Provider</span>
              <span className="text-teal-400 font-semibold">{selectedModel.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Context Window</span>
              <span className="text-zinc-300">{(selectedModel.contextLength / 1024).toFixed(0)}k tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pricing</span>
              <span className="text-emerald-400 font-bold">$0.00 / Free</span>
            </div>
          </div>
        </div>

        {/* Section: Active API Key */}
        <div className="space-y-2 text-xs">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Authentication Token</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-teal-500"
          >
            {apiKeys.map(k => (
              <option key={k.key} value={k.key}>
                {k.name} ({k.key.slice(0, 14)}...)
              </option>
            ))}
          </select>
        </div>

        {/* Section: Parameters Sliders */}
        <div className="space-y-3 text-xs pt-2 border-t border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Generation Settings</span>
          
          <div>
            <div className="flex justify-between text-zinc-400 mb-1">
              <span>Temperature</span>
              <span className="font-mono text-teal-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-zinc-400 mb-1">
              <span>Max Tokens</span>
              <span className="font-mono text-teal-400">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>
        </div>

        {/* System Prompt Input */}
        <div className="space-y-2 text-xs pt-2 border-t border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">System Prompt</span>
          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full bg-[#18181b] border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-teal-500 resize-none"
          />
        </div>

      </div>

    </div>
  );
};
