import { GeneratedCode } from "../types";

export const extractCodeBlock = (markdown: string): GeneratedCode | null => {
  // Regex to match markdown code blocks: ```language code ```
  // We prioritize HTML blocks as per our system instruction
  const htmlRegex = /```html\s*([\s\S]*?)\s*```/;
  const htmlMatch = markdown.match(htmlRegex);

  if (htmlMatch && htmlMatch[1]) {
    return {
      language: 'html',
      code: htmlMatch[1].trim()
    };
  }

  // Fallback for generic blocks if strictly needed, but we mostly want HTML
  const genericRegex = /```(\w+)\s*([\s\S]*?)\s*```/;
  const genericMatch = markdown.match(genericRegex);

  if (genericMatch && genericMatch[1] && genericMatch[2]) {
     // If it's pure JS/TS, we might skip it or handle it, but for now we focus on the full HTML runner
     return {
        language: genericMatch[1],
        code: genericMatch[2].trim()
     };
  }

  return null;
};
