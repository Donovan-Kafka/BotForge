
// For a prototype, we don't need the real Google GenAI SDK.
// We will simulate a response.

export const generateBotResponse = async (
  message: string, 
  systemInstruction: string = "You are a helpful AI assistant created by BotForge."
): Promise<string> => {
  // Simulate network delay (1 second) to make it feel real
  await new Promise(resolve => setTimeout(resolve, 1000));


  return `HI`;
};
