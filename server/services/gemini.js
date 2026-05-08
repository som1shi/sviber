const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

function getGeminiStatus() {
  return {
    configured: Boolean(getGeminiApiKey()),
    keyName: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : null,
    model: getGeminiModelName(),
  };
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('Gemini returned an empty response');

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const match = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) throw new Error('No JSON found in Gemini response');
    return JSON.parse(match[0]);
  }
}

async function generateGeminiText(prompt, options = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set. Add it to server/.env or your host environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: options.model || getGeminiModelName(),
    generationConfig: options.generationConfig,
  });

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function generateGeminiJson(prompt, options = {}) {
  const text = await generateGeminiText(prompt, {
    ...options,
    generationConfig: {
      responseMimeType: 'application/json',
      ...(options.generationConfig || {}),
    },
  });

  return extractJson(text);
}

module.exports = {
  extractJson,
  generateGeminiJson,
  generateGeminiText,
  getGeminiApiKey,
  getGeminiModelName,
  getGeminiStatus,
};
