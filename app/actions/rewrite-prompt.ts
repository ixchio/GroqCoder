import { InferenceClient } from "@huggingface/inference";

const START_REWRITE_PROMPT = ">>>>>>> START PROMPT >>>>>>";
const END_REWRITE_PROMPT = ">>>>>>> END PROMPT >>>>>>";

export const callAiRewritePrompt = async (prompt: string, { token, billTo }: { token: string, billTo?: string | null }) => {
  const client = new InferenceClient(token);
  const response = await client.chatCompletion(
    {
      model: "deepseek-ai/DeepSeek-V3.1",
      provider: "novita",
      messages: [{
        role: "system",
        content: `You are a helpful assistant that rewrites prompts to make them better. All the prompts will be about creating a website or app.
Try to make the prompt more detailed and specific to create a good UI/UX Design and good code.
Format the result by following this format:
${START_REWRITE_PROMPT}
new prompt here
${END_REWRITE_PROMPT}
If you don't rewrite the prompt, return the original prompt.
Make sure to return the prompt in the same language as the prompt you are given. Also IMPORTANT: Make sure to keep the original intent of the prompt. Improve it it needed, but don't change the original intent.
`
      },{ role: "user", content: prompt }],
    },
    billTo ? { billTo } : {}
  );
  
  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent) {
    return prompt;
  }
  const startIndex = responseContent.indexOf(START_REWRITE_PROMPT);
  const endIndex = responseContent.indexOf(END_REWRITE_PROMPT);
  return responseContent.substring(startIndex + START_REWRITE_PROMPT.length, endIndex);
};