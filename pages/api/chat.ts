import type { NextApiRequest, NextApiResponse } from "next";
import { makeChain } from "./util";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const body = req.body;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    // Important to set no-transform to avoid compression, which will delay
    // writing response chunks to the client.
    // See https://github.com/vercel/next.js/issues/9965
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  sendData(JSON.stringify({ data: "" }));

  const chain = await makeChain((token: string) => {
    sendData(JSON.stringify({ data: token }));
  });

  try {
    await chain.call({ question: body.question });
  } catch {
    // Ignore error
  } finally {
    sendData("[DONE]");
    res.end();
  }
}
