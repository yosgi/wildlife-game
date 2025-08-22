import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { question, animal } = await request.json()

    const context = animal ? `Question about ${animal.name} (${animal.species}):` : "Question about New Zealand wildlife:"

    const prompt = `${context}

Question: ${question}

Please provide an accurate, interesting answer suitable for children to understand. If the question is related to New Zealand wildlife conservation, focus on conservation knowledge. Answer should be within 150 words.`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    return Response.json({ answer: text.trim() })
  } catch (error) {
    console.error("AI chat error:", error)
    return Response.json({ error: "Unable to generate answer, please try again later" }, { status: 500 })
  }
}
