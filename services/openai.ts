
import { AISettings, Message, Role } from "../types";
import { INITIAL_SYSTEM_INSTRUCTION } from "../constants";

export const streamOpenAI = async function* (
  messages: Message[],
  settings: AISettings
) {
  const baseUrl = settings.baseUrl ? settings.baseUrl.replace(/\/$/, '') : 'https://api.openai.com/v1';
  const url = `${baseUrl}/chat/completions`;

  const systemMessage = {
    role: "system",
    content: INITIAL_SYSTEM_INSTRUCTION
  };

  const apiMessages = [
    systemMessage,
    ...messages.map(m => ({
      role: m.role === Role.USER ? "user" : "assistant",
      content: m.content
    }))
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: apiMessages,
      stream: true,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      
      const dataStr = trimmed.slice(6);
      if (dataStr === "[DONE]") return;

      try {
        const data = JSON.parse(dataStr);
        const content = data.choices?.[0]?.delta?.content;
        if (content) {
          yield { text: content };
        }
      } catch (e) {
        console.error("Error parsing SSE line", e);
      }
    }
  }
};
