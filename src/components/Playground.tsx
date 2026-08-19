'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Sliders, Zap, Shield, Sparkles } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ApiKeyItem {
  key: string;
  name: string;
}

export const Playground: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('opencode/free-model');
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');

  const [systemPrompt, setSystemPrompt] = useState<string>('You are an intelligent AI assistant provided by Loreder AI Aggregator using OpenCode Zen free models.');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [latency, setLatency] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        setModels(data);
        if (data.length > 0) setSelectedModel(data[0].id);
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating || !selectedKey) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsGenerating(true);

    const startTime = Date.now();
    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages([...updatedMessages, assistantMessage]);

    try {
      const payload = {
        model: selectedModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...updatedMessages
        ],
        temperature,
        max_tokens: maxTokens,
        stream: true
      };

      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${selectedKey}`
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
                    content: accumulatedContent
                  };
                }
                return next;
              });
            } catch (pErr) {
              // Raw text chunk handling fallback
            }
          }
        }
      }

      setLatency(Date.now() - startTime);
    } catch (err: any) {
      console.error('Playground chat error:', err);
      setMessages(prev => {
        const next = [...prev];
        if (next.length > 0) {
          next[next.length - 1] = {
            role: 'assistant',
            content: `⚠️ Rate Limit / Request Error: ${err.message || 'OpenCode Zen rate limit reached. Please wait 15 seconds or switch model.'}`
          };
        }
        return next;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)] min-h-[600px]">
      {/* Sidebar Controls */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 lg:col-span-1 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-teal-400" />
              Model Parameters
            </h3>
            <span className="text-[10px] uppercase font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
              OpenCode Zen
            </span>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-500"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {/* API Key Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Active Auth API Key</span>
              <Shield className="w-3 h-3 text-teal-400" />
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-teal-500"
            >
              {apiKeys.map(k => (
                <option key={k.key} value={k.key}>
                  {k.name} ({k.key.slice(0, 16)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
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

          {/* Max Tokens Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Max Tokens</span>
              <span className="font-mono text-sky-400">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* System Prompt Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">System Prompt</label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>
        </div>

        {/* Latency & Clear */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {latency && (
            <div className="text-xs text-slate-400 flex justify-between items-center bg-slate-900/50 p-2 rounded-lg">
              <span>Last Latency:</span>
              <span className="font-mono text-teal-400 font-semibold">{latency} ms</span>
            </div>
          )}

          <button
            onClick={() => setMessages([])}
            className="w-full flex items-center justify-center py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Clear Conversation
          </button>
        </div>
      </div>

      {/* Interactive Streamed Chat Box */}
      <div className="glass-card rounded-2xl border border-slate-800 lg:col-span-3 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Interactive Model Playground</h3>
              <p className="text-xs text-teal-400 font-mono">Routing through: {selectedModel}</p>
            </div>
          </div>
        </div>

        {/* Message History Window */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-teal-400">
                <Bot className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-300">Playground Ready</h4>
              <p className="text-xs max-w-sm">
                Select an OpenCode Zen free model on the left, type a prompt below, and see live streamed AI responses.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-900/20'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none font-sans'
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex items-center text-teal-400">
                      <Zap className="w-3 h-3 mr-1.5 animate-bounce" /> Streaming response from OpenCode Zen...
                    </span>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/60 flex space-x-3">
          <input
            type="text"
            placeholder="Type your prompt here (e.g. Write a python script to parse JSON stream)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg shadow-teal-500/20"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
