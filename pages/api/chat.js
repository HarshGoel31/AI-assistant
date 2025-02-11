// pages/api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Replace with your Google AI API key
const apiKey = process.env.NEXT_GEN_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { prompt } = req.body;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const response = await model.generateContent(prompt);
      const aiResponse = response.response.candidates[0].content.parts[0].text;

      res.status(200).json({ response: aiResponse });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
