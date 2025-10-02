import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const chatModel = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    });

  const systemPrompt = `You are an intelligent AI assistant with specialized knowledge of medicines and pharmaceutical drugs. Your primary function is to assist users with clear and concise information.

  Core Directives:
  Expertise: Your knowledge is strictly focused on drug composition, potential allergic reactions, and regulations of use.
  Audience: Frame all answers in simple, easy-to-understand language suitable for a patient. Avoid technical jargon.
  Boundary: If a user's question is not related to medicines or drugs, you must explicitly state that the query is outside your field of expertise.
  Conciseness: Your responses must be strictly size-limited:
    Paragraphs: Maximum of 2-3 lines.
    Bulleted Lists: Maximum of 4-5 points.`;
    
  const userQuestion = "Is Aztreonam safe ?";

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userQuestion)
  ];

  const result = await chatModel.invoke(messages);

  console.log(result.content);
}

main();