import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Budget } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ScannedReceipt {
  title: string;
  amount: number;
  category: string;
  date?: string;
  items?: { name: string; price: number }[];
}

export async function scanReceipt(base64Image: string, mimeType: string): Promise<ScannedReceipt> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Extract transaction details from this receipt. Return JSON with title (merchant name), total amount (number), category (one of: Makanan, Transportasi, Hiburan, Belanja, Tagihan, Kesehatan, Lainnya), and date (YYYY-MM-DD). If merchant name is not clear, use "Struk Belanja".`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ["title", "amount", "category"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result as ScannedReceipt;
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Gagal memproses struk. Pastikan gambar jelas.");
  }
}

export interface FamilyInsight {
  analysis: string;
  savingsSuggestions: string[];
  budgetPrediction: string;
  healthScore: number; // 0-100
}

export async function analyzeFamilyFinances(
  transactions: Transaction[], 
  budgets: Budget[],
  familyName: string
): Promise<FamilyInsight> {
  try {
    const summary = {
      familyName,
      totalTransactions: transactions.length,
      totalSpent: transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0),
      totalIncome: transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0),
      categories: budgets.map(b => ({ name: b.category, spent: b.spent, limit: b.limit })),
      recentTransactions: transactions.slice(0, 10).map(t => ({ title: t.title, amount: t.amount, category: t.category, user: t.userName }))
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Analyze this family financial data: ${JSON.stringify(summary)}. 
          Return a JSON object with:
          1. analysis: A brief paragraph in Bahasa Indonesia analyzing spending patterns.
          2. savingsSuggestions: Array of 3 specific savings tips in Bahasa Indonesia based on the data.
          3. budgetPrediction: A short prediction for next month in Bahasa Indonesia.
          4. healthScore: A number from 0 to 100 representing financial health.
          Be professional, encouraging, and clear.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            savingsSuggestions: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            budgetPrediction: { type: Type.STRING },
            healthScore: { type: Type.NUMBER }
          },
          required: ["analysis", "savingsSuggestions", "budgetPrediction", "healthScore"],
        },
      },
    });

    return JSON.parse(response.text) as FamilyInsight;
  } catch (error) {
    console.error("Error analyzing finances:", error);
    throw new Error("Gagal menganalisis keuangan.");
  }
}
