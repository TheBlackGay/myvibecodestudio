import { GeneratedCode } from "../types";

export const extractCodeBlock = (markdown: string): GeneratedCode | null => {
  // 1. Try to find a complete HTML block first
  const htmlRegex = /```html\s*([\s\S]*?)\s*```/;
  const htmlMatch = markdown.match(htmlRegex);

  if (htmlMatch && htmlMatch[1]) {
    return {
      language: 'html',
      code: htmlMatch[1].trim()
    };
  }

  // 2. Fallback: Check for an open-ended HTML block (useful for streaming)
  // We look for ```html followed by anything
  const openHtmlRegex = /```html\s*([\s\S]*)/;
  const openMatch = markdown.match(openHtmlRegex);

  if (openMatch && openMatch[1]) {
     return {
        language: 'html',
        code: openMatch[1].trim()
     };
  }

  // 3. Generic fallback (optional, but we prioritize HTML for this app)
  const genericRegex = /```(\w+)\s*([\s\S]*?)\s*```/;
  const genericMatch = markdown.match(genericRegex);

  if (genericMatch && genericMatch[1] && genericMatch[2]) {
     return {
        language: genericMatch[1],
        code: genericMatch[2].trim()
     };
  }

  return null;
};