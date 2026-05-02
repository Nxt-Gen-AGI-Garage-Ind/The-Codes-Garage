/**
 * THE FOREMAN: Smart Diagnostic Logic
 * This engine analyzes code complexity and selects the best AI Agent.
 */
export const analyzeCode = (code: string) => {
  const codeLength = code.length;
  const isBroken = code.includes("error") || code.includes("undefined") || code.includes("null");

  // Selection Logic
  const recommendation = codeLength > 1500 ? "Gemini 1.5 Pro" : "Claude 3.5 Sonnet";
  const probability = isBroken ? 75 : 95;

  return {
    agent: recommendation,
    chance: `${probability}%`,
    status: "SYSTEMS ONLINE"
  };
};
