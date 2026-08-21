import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

export const aiRouter = Router();

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// POST /api/ai/generate-set
aiRouter.post('/generate-set', async (req, res) => {
  try {
    const { topic, gradeLevel, count = 5, subject = 'General' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
        useFallback: true,
      });
    }

    const prompt = `Create an educational question set about "${topic}" for grade level "${gradeLevel || 'Grade 3'}". Subject: "${subject}". Generate ${count} high-quality, engaging questions. Each question must have promptText, 4 distinct options (multiple choice), correct answer (which must match one of the options), and a helpful hint.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert K-12 educator creating interactive learning question sets. Provide strictly valid JSON conforming to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            subject: { type: Type.STRING },
            gradeLevel: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  promptText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  answer: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['promptText', 'options', 'answer', 'hint'],
              },
            },
          },
          required: ['title', 'subject', 'gradeLevel', 'questions'],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('No response text received from Gemini API');
    }

    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error('AI Generation error:', err);
    res.status(500).json({ error: err.message || 'Internal server error', useFallback: true });
  }
});
