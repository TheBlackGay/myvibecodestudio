
import { GeneratedCode } from "../types";

export const extractCodeBlock = (markdown: string): GeneratedCode | null => {
  const fileMap: GeneratedCode = {};
  
  // 1. Check for legacy single file format (fallback)
  // If no file delimiters are found, treat the whole block as index.html
  if (!markdown.includes('<!-- __VIBE_FILE:')) {
     const htmlRegex = /```html\s*([\s\S]*?)\s*```/;
     const match = markdown.match(htmlRegex);
     if (match && match[1]) {
       return {
         'public/index.html': { language: 'html', content: match[1].trim() }
       };
     }
     // Streaming fallback
     const openMatch = markdown.match(/```html\s*([\s\S]*)/);
     if (openMatch && openMatch[1]) {
        return {
          'public/index.html': { language: 'html', content: openMatch[1].trim() }
        };
     }
     return null;
  }

  // 2. Multi-file parsing
  // Remove markdown code block markers if they wrap the whole thing
  let cleanMarkdown = markdown;
  // We don't want to strip internal code blocks, just outer ones if the AI wrapped the whole response
  // But usually, the AI follows the template. 
  // Let's split by the delimiter directly.
  
  const parts = markdown.split(/<!-- __VIBE_FILE: (.*?) -->/);
  
  // parts[0] is preamble text before first file
  // parts[1] is filename1
  // parts[2] is content1
  // parts[3] is filename2
  // parts[4] is content2
  // ...
  
  for (let i = 1; i < parts.length; i += 2) {
    const filename = parts[i].trim();
    let content = parts[i + 1] || '';

    // Clean up content: remove markdown code fences if present around the file content
    content = content.replace(/```\w*\n?/, '').replace(/```$/, '');
    
    // Determine language based on extension
    let language = 'plaintext';
    if (filename.endsWith('.html')) language = 'html';
    else if (filename.endsWith('.css')) language = 'css';
    else if (filename.endsWith('.js') || filename.endsWith('.jsx')) language = 'javascript';
    else if (filename.endsWith('.md')) language = 'markdown';

    fileMap[filename] = {
      language,
      content: content.trim()
    };
  }

  return Object.keys(fileMap).length > 0 ? fileMap : null;
};
