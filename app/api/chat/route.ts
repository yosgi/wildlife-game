import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { question, animal } = await request.json()

    const context = animal ? `关于${animal.name}(${animal.species})的问题：` : "关于新西兰动物的问题："

    const prompt = `${context}

问题：${question}

请提供准确、有趣且适合儿童理解的答案。如果问题与新西兰动物保护相关，请重点介绍保护知识。答案应该在150字以内。`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      maxTokens: 300,
    })

    return Response.json({ answer: text.trim() })
  } catch (error) {
    console.error("AI chat error:", error)
    return Response.json({ error: "无法生成回答，请稍后再试" }, { status: 500 })
  }
}
