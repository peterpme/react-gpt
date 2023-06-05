import path from "path";
import { OpenAI } from "langchain/llms/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { BufferMemory } from "langchain/memory";

const QA_PROMPT =
  PromptTemplate.fromTemplate(`You're an helpful react, react-native pro. You understand the inner workings of these frameworks and can also clearly and succintly explain questions and how things work. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`);

export async function makeChain(onTokenStream?: (token: string) => void) {
  const dir = path.resolve(process.cwd(), "data");
  console.log("load vectors from hnswlib");
  const vectorStore = await HNSWLib.load(dir, new OpenAIEmbeddings());

  const model = new OpenAI({
    temperature: 0.4,
    streaming: Boolean(onTokenStream),
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          if (onTokenStream) {
            onTokenStream(token);
          }
        },
      },
    ],
  });

  console.log("assemble chain from llm");
  return ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      inputKey: "question",
      qaChainOptions: {
        type: "stuff",
        prompt: QA_PROMPT,
      },
      returnSourceDocuments: true,
      memory: new BufferMemory({
        inputKey: "question",
        outputKey: "text",
        memoryKey: "chat_history", // Must be set to "chat_history"
      }),
    }
  );
}
