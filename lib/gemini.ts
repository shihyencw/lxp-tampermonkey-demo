import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  // In a real app, you might show a more user-friendly error or disable AI features.
  // For this context, throwing an error is sufficient to indicate a misconfiguration.
  console.error("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

function base64ToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
}

const getMimeType = (base64: string) => {
    return base64.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
}

export async function generateProductName(imageBase64: string): Promise<string> {
  const mimeType = getMimeType(imageBase64);
  const imagePart = base64ToGenerativePart(imageBase64, mimeType);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      '根據這張圖片，為這個商品想一個簡潔、吸引人的中文商品名稱。只回傳商品名稱，不要有任何多餘的文字或引號。',
      imagePart
    ],
  });

  return response.text.trim().replace(/["'"]/g, ''); // Remove quotes
}

export async function generateProductDescription(imageBase64: string, productName: string): Promise<string> {
    const mimeType = getMimeType(imageBase64);
    const imagePart = base64ToGenerativePart(imageBase64, mimeType);

    const prompt = `這是商品 "${productName}" 的圖片。請為這個商品撰寫一段生動有趣、吸引人的中文商品描述，長度約在 100-150 字之間，要能凸顯商品特色。`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [prompt, imagePart],
    });

    return response.text.trim();
}

export async function generateProductPrice(productName: string, productDescription: string): Promise<number> {
    const prompt = `
        分析以下商品資訊：
        商品名稱：${productName}
        商品描述：${productDescription}

        根據這些資訊，請建議一個合理的台幣(NT$)售價。請只回傳一個數字，不要包含任何文字說明。
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [prompt],
    });

    try {
        const text = response.text.trim();
        // Try to extract number from response
        const priceMatch = text.match(/\d+/);
        if (priceMatch) {
            return parseInt(priceMatch[0], 10);
        }
        return 0;
    } catch (e) {
        console.error("Failed to parse price from AI response:", response.text, e);
        return 0;
    }
}
