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

const callOpenRouter = async (model: string, prompt: string) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey.length < 10) {
    throw new Error("OpenRouter API Key is missing or invalid. Please configure VITE_OPENROUTER_API_KEY in your environment.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://the-codes-garage.vercel.app/",
      "X-Title": "The Code Garage"
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const runDualAgentDiagnostic = async (sourceCode: string) => {
  // Step 1: The Architect Plans
  const architectModel = import.meta.env.VITE_ARCHITECT_MODEL || 'openai/gpt-4o-mini';
  const plan = await callOpenRouter(architectModel, `Plan a thorough repair for the following code. Return a structured JSON plan for fixing any logic errors, security leaks, or syntax issues: ${sourceCode}`);
  
  // Step 2: The Mechanic Executes
  const mechanicModel = import.meta.env.VITE_MECHANIC_MODEL || 'qwen/qwen-2.5-coder-32b';
  const finalCode = await callOpenRouter(mechanicModel, `Execute the following repair plan and return the final, functional TypeScript code only. Plan: ${plan}. Source Code: ${sourceCode}`);
  
  return finalCode;
};

export function analyzeCodeInline(code: string, language: string, category: string): { suggestedApi: Api | null; probability: number } {
  const lineCount = code.split('\n').length;
  const hasAsync = code.includes('async') || code.includes('await');
  const isComplex = lineCount > 20 || hasAsync || code.includes('class') || code.includes('function');

  let suggestedApi: Api | null = null;
  let probability = 85;

  if (category === 'tuning' && isComplex && (language === 'javascript' || language === 'typescript')) {
    probability = 92;
    suggestedApi = { name: 'Gemini', endpoint: 'https://api.groq.com/v1/chat/completions', model: 'mixtral-8x7b-32768', type: 'openai' as const };
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
