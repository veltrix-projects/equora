import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY!);

export async function generateGroupInsights(groupName: string, expenses: any[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    As a fintech expert for the app 'Equora', analyze these group expenses for '${groupName}':
    ${JSON.stringify(expenses)}

    Provide:
    1. A single sentence executive summary.
    2. One smart saving tip for this group.
    3. Identifying the biggest spender category.

    Format as JSON: { "summary": "", "tip": "", "biggest_category": "" }
    Keep it concise and premium.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}
