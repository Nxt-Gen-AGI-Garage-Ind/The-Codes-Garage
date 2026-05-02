export interface Api {
  name: string;
  endpoint: string;
  model?: string;
  key?: string;
  type?: 'ollama' | 'openai';
}

export const categories = [
  { id: 'overhaul' as const, name: 'The Overhaul (Fixer)', emoji: '🔧', color: 'orange' as const, prompt: 'Deep structural repairs for broken logic and syntax errors in this code: {code} Language: {lang}' },
  { id: 'tuning' as const, name: 'The Tuning (Refiner)', emoji: '⚙️', color: 'blue' as const, prompt: 'Optimization for performance, readability, and modern best practices in this {lang} code: {code}' },
  { id: 'scan' as const, name: 'The Scan (Debugger)', emoji: '🔍', color: 'red' as const, prompt: 'Logical trace-through to find hidden leaks or edge-case bugs in this {lang} code: {code}' }
] as const;

export type CategoryId = typeof categories[number]['id'];

export function analyzeCodeInline(code: string, language: string, category: string): { suggestedApi: Api | null; probability: number } {
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
