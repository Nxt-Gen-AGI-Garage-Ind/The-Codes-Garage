import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';

const categories = [
  { id: 'overhaul' as const, name: 'The Overhaul (Fixer)', emoji: '🔧', color: 'orange' as const, prompt: 'Deep structural repairs for broken logic and syntax errors in this code: {code} Language: {lang}' },
  { id: 'tuning' as const, name: 'The Tuning (Refiner)', emoji: '⚙️', color: 'blue' as const, prompt: 'Optimization for performance, readability, and modern best practices in this {lang} code: {code}' },
  { id: 'scan' as const, name: 'The Scan (Debugger)', emoji: '🔍', color: 'red' as const, prompt: 'Logical trace-through to find hidden leaks or edge-case bugs in this {lang} code: {code}' }
];

type CategoryId = typeof categories[number]['id'];

interface Api {
  name: string;
  endpoint: string;
  model?: string;
  key?: string;
  type?: 'ollama' | 'openai';
}

interface LogEntry {
  message: string;
  timestamp: string;
}

function analyzeCodeInline(code: string, language: string, category: string): { suggestedApi: Api | null; probability: number } {
  // Simple heuristic analysis based on code complexity and language
  const lineCount = code.split('\n').length;
  const hasAsync = code.includes('async') || code.includes('await');
  const isComplex = lineCount > 20 || hasAsync || code.includes('class') || code.includes('function');

  let suggestedApi: Api | null = null;
  let probability = 85;

  if (category === 'tuning' && isComplex && (language === 'javascript' || language === 'typescript')) {
    probability = 92;
    suggestedApi = { name: 'Gemini', endpoint: 'https://api.groq.com/v1/chat/completions', model: 'mixtral-8x7b-32768', type: 'openai' as const }; // Long context for JS/TS
  } else if (category === 'scan' && language === 'python') {
    probability = 78;
    suggestedApi = { name: 'Claude', endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-3-sonnet-20240229', type: 'openai' as const };
  } else if (category === 'overhaul') {
    probability = 88;
    suggestedApi = { name: 'GPT-4', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4', type: 'openai' as const };
  } else {
    suggestedApi = { name: 'Default', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo', type: 'openai' as const };
  }

  return { suggestedApi, probability };
}

function App() {
  const [code, setCode] = useState<string>('// Start coding here...');
  const [language, setLanguage] = useState<string>('javascript');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('overhaul');
  const [apis, setApis] = useState<Api[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [showOllamaModal, setShowOllamaModal] = useState<boolean>(false);
  const [showPuterModal, setShowPuterModal] = useState<boolean>(false);
  const [selectedApi, setSelectedApi] = useState<Api | null>(null);
  const [probability, setProbability] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedApis = localStorage.getItem('codeGarageApis');
      if (savedApis) {
        const parsed = JSON.parse(savedApis) as Api[];
        setApis(parsed);
        if (parsed.length > 0) {
          setSelectedApi(parsed[0]);
        }
      } else {
        const defaultApi: Api = { name: 'Default OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo' };
        setSelectedApi(defaultApi);
      }
    } catch (err) {
      setError('Failed to load saved settings.');
    }
  }, []);

  useEffect(() => {
    if (!error) {
      localStorage.setItem('codeGarageApis', JSON.stringify(apis));
    }
  }, [apis, error]);

  const addLog = (message: string): void => {
    setConsoleLogs(prev => [...prev, { message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostic = async (): Promise<void> => {
    if (!selectedApi) {
      addLog('No API selected. Please configure APIs.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    const cat = categories.find(c => c.id === selectedCategory)!;
    addLog(`Starting ${cat.name}...`);

    // Inline Foreman analysis
    const { suggestedApi: foremanSuggested, probability: foremanProb } = analyzeCodeInline(code, language, cat.id);
    let currentApi = selectedApi!;
    let prob = foremanProb;
    if (foremanSuggested && apis.some(api => api.name === foremanSuggested.name)) {
      currentApi = foremanSuggested;
      setSelectedApi(foremanSuggested);
      addLog(`Foreman suggests ${foremanSuggested.name} for ${cat.name} (optimized for ${language})... Probability: ${foremanProb.toFixed(1)}%`);
    } else {
      const fallbackApi = apis.length > 0 ? apis[0] : selectedApi!;
      currentApi = fallbackApi;
      setSelectedApi(fallbackApi);
      prob = Math.random() * 20 + 80;
      setProbability(prob);
      addLog(`Using ${fallbackApi.name} for ${cat.name}... Probability: ${prob.toFixed(1)}%`);
    }
    setProbability(prob);

    const prompt = cat.prompt.replace('{code}', code).replace('{lang}', language);

    try {
      let response;
      if (currentApi.type === 'ollama') {
        response = await fetch(currentApi.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: currentApi.model,
            prompt,
            stream: false,
          }),
        });
        if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
        const data = await response.json();
        const aiResponse = data.response;
        addLog('Diagnostic complete. Suggested fixes:');
        addLog(aiResponse);
      } else {
        response = await fetch(currentApi.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentApi.key && { 'Authorization': `Bearer ${currentApi.key}` }),
          },
          body: JSON.stringify({
            model: currentApi.model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            stream: false,
          }),
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        addLog('Diagnostic complete. Suggested fixes:');
        addLog(aiResponse);
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      addLog(`Error: ${errorMsg}`);
      setError(`Diagnostic failed: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const languagesList = ['javascript', 'python', 'typescript', 'java', 'c++', 'go', 'rust', 'php', 'sql', 'html'];

  const LanguageSelector = ({ languages, language, setLanguage }: { languages: string[]; language: string; setLanguage: (lang: string) => void }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2 text-gray-300">Language:</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
      >
        {languages.map(lang => (
          <option key={lang} value={lang}>{lang.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );

  const FeedbackConsole = ({ logs }: { logs: LogEntry[] }) => (
    <div className="h-full bg-black p-2 overflow-y-auto text-sm">
      <div className="text-orange-500 mb-2 font-medium">Diagnostic Logs:</div>
      {logs.map((log, index) => (
        <div key={index} className="mb-1">
          <span className="text-gray-400">[ {log.timestamp} ]</span> {log.message}
        </div>
      ))}
      {logs.length === 0 && <div className="text-gray-500">No logs yet. Run a diagnostic!</div>}
    </div>
  );

  const ApiModal = ({ show, onClose, onAdd }: { show: boolean; onClose: () => void; onAdd: (api: Omit<Api, 'type'>) => void }) => {
    const [name, setName] = useState('');
    const [endpoint, setEndpoint] = useState('https://api.openai.com/v1/chat/completions');
    const [model, setModel] = useState('gpt-3.5-turbo');
    const [key, setKey] = useState('');

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAdd({ name, endpoint, model, key });
      setName(''); setEndpoint('https://api.openai.com/v1/chat/completions'); setModel('gpt-3.5-turbo'); setKey('');
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-orange-500">⚙️ Add API</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Endpoint</label>
              <input type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Model</label>
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">API Key</label>
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" required />
            </div>
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 p-2 rounded text-white">Add API</button>
          </form>
        </div>
      </div>
    );
  };

  const OllamaModal = ({ show, onClose, onAdd }: { show: boolean; onClose: () => void; onAdd: (api: Omit<Api, 'type'>) => void }) => {
    const [name, setName] = useState('Ollama Local');
    const [endpoint, setEndpoint] = useState('http://localhost:11434/api/generate');
    const [model, setModel] = useState('llama3');

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAdd({ name, endpoint, model });
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-500">⚡ Ollama Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Endpoint</label>
              <input type="url" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Model</label>
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white" />
            </div>
            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 p-2 rounded text-white">Save</button>
          </form>
        </div>
      </div>
    );
  };

  const PuterModal = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
    const [apiKey, setApiKey] = useState('');

    if (!show) return null;

    const handleSave = () => {
      localStorage.setItem('puterApiKey', apiKey);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-green-500">💾 Puter.js Config</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">API Key (Optional)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Enter Puter API key"
            />
          </div>
          <button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 p-2 rounded text-white">Save</button>
          <p className="text-xs text-gray-400 mt-3">Enables cloud OS integration.</p>
        </div>
      </div>
    );
  };

  const CodeEditor = ({ code, setCode, language }: { code: string; setCode: (code: string) => void; language: string }) => (
    <div className="h-full">
      <Editor
        height="100%"
        language={language as any}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
      />
    </div>
  );

  const LivePreview = ({ code, language }: { code: string; language: string }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      if (['html', 'javascript'].includes(language)) {
        const iframe = iframeRef.current;
        if (iframe) {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(language === 'html' ? code : `<html><body><script>${code}</script></body></html>`);
            doc.close();
          }
        }
      }
    }, [code, language]);

    if (['html', 'javascript'].includes(language)) {
      return <iframe ref={iframeRef} className="w-full h-full border-0 bg-white" sandbox="allow-scripts" />;
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 text-sm p-4">
        Preview for {language.toUpperCase()} not supported yet. Use HTML/JS.
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Safe Mode</h1>
          <p className="mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded">
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col industrial-theme">
      <header className="bg-gray-800 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-orange-500 text-3xl">⚙️</span>
          <h1 className="text-2xl font-bold text-orange-500">The Code Garage</h1>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => setShowApiModal(true)} className="flex items-center space-x-1 text-orange-400 hover:text-orange-300">
            <span>⚙️</span><span>APIs</span>
          </button>
          <button onClick={() => setShowOllamaModal(true)} className="flex items-center space-x-1 text-blue-400 hover:text-blue-300">
            <span>⚡</span><span>Ollama</span>
          </button>
          <button onClick={() => setShowPuterModal(true)} className="flex items-center space-x-1 text-green-400 hover:text-green-300">
            <span>💾</span><span>Puter</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-gray-800 border-r p-4 space-y-6 overflow-y-auto">
          <LanguageSelector languages={languagesList} language={language} setLanguage={setLanguage} />
          
          <div className="space-y-2">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full p-3 rounded-lg flex items-center space-x-3 ${selectedCategory === cat.id ? `bg-${cat.color}-600` : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <span className={`text-${cat.color}-400 text-lg`}>{cat.emoji}</span>
                <span className="font-medium text-gray-300">{cat.name}</span>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runDiagnostic}
            disabled={isProcessing || !selectedApi}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 p-3 rounded-lg flex items-center justify-center space-x-2 text-white font-medium transition-all ignition-button"
          >
            {isProcessing ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="gear-spin text-xl"
                >
                  ⚙️
                </motion.span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🚀</span>
                <span>Run Diagnostic (Ignition)</span>
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-700 p-3 rounded-lg"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Success Probability:</span>
                  <div className="w-20 bg-gray-600 rounded-full h-2">
                    <motion.div
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${probability}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-green-400">{probability.toFixed(1)}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <section className="flex-1 border-r border-gray-700">
              <CodeEditor code={code} setCode={setCode} language={language} />
            </section>
            <section className="w-1/2 border-l border-gray-700 bg-white">
              <LivePreview code={code} language={language} />
            </section>
          </div>
          <section className="h-48 border-t border-gray-700 bg-black">
            <FeedbackConsole logs={consoleLogs} />
          </section>
        </main>
      </div>

      <ApiModal show={showApiModal} onClose={() => setShowApiModal(false)} onAdd={(newApi) => setApis(prev => [...prev, newApi as Api])} />
      <OllamaModal show={showOllamaModal} onClose={() => setShowOllamaModal(false)} onAdd={(newApi) => setApis(prev => [...prev, { ...newApi, type: 'ollama' } as Api])} />
      <PuterModal show={showPuterModal} onClose={() => setShowPuterModal(false)} />
    </div>
  );
}

export default App;
