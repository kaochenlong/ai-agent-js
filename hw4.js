import { input } from "@inquirer/prompts";
import { client, DEFAULT_MODEL } from "./lib/openai.js";
import { spinner } from "./utils/spinner.js";
import { toOpenAITool } from "./utils/func-tool.js";
import * as allTools from "./tools/index.js";
import { initMessage, addMessage, getMessages } from "./db/messages.js";

const toolList = Object.values(allTools);
const tools = toolList.map(toOpenAITool);
const AVAILABLE_TOOLS = Object.fromEntries(toolList.map((t) => [t.name, t.fn]));

const systemPrompt =
  "你是一位貼心的助理，可以使用提供的工具回答使用者的問題。請用繁體中文回答。遇到任單位換算問題，請一律使用 convertUnitTool 工具，不要自己心算。";

try {
  // 初始化訊息紀錄
  await initMessage(systemPrompt);
  
  // 從 DB 載入所有歷史訊息
  let messages = getMessages();

  // 反序列化被存為 JSON 字符串的訊息
  messages = messages.map(msg => {
    if ((msg.role === "assistant" || msg.role === "tool") && typeof msg.content === "string") {
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed && typeof parsed === "object" && parsed.role) {
          return parsed;
        }
      } catch (e) {
        // 不是有效 JSON，保留原樣
      }
    }
    return msg;
  });

  while (true) {
    const userQuestion = (
      await input({ message: "請輸入你的問題：" })
    ).trim();

    if (userQuestion === "") continue;
    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    // 新增使用者訊息
    messages.push({ role: "user", content: userQuestion });
    await addMessage(userQuestion, "user");

    while (true) {
      const spin = spinner("思考中...").start();

      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        tools,
        tool_choice: "auto",
      });

      spin.stop();

      const message = response.choices[0].message;
      messages.push(message);

      // 儲存助理訊息到 DB（序列化複雜物件）
      await addMessage(JSON.stringify(message), "assistant");

      if (!message.tool_calls || message.tool_calls.length === 0) {
        console.log(message.content);
        break;
      }

      for (const toolCall of message.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`\n[呼叫 tool] ${fnName}(${JSON.stringify(args)})`);

        const fn = AVAILABLE_TOOLS[fnName];
        const result = await fn(args);

        const toolMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        };

        messages.push(toolMessage);
        
        // 儲存 tool 訊息到 DB
        await addMessage(JSON.stringify(toolMessage), "tool");
      }
    }
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}