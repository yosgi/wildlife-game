import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Animal } from "../GameState"

export interface ChatMessage {
  id: string
  sender: "user" | "animal"
  message: string
  timestamp: number
}

export class ChatService {
  private apiKey?: string
  private chatHistory: ChatMessage[] = []

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  }

  async chatWithAnimal(animal: Animal, userMessage: string): Promise<string> {
    // Add user message to history
    this.addMessage("user", userMessage)

    if (!this.apiKey) {
      const fallbackResponse = this.getFallbackResponse(animal, userMessage)
      this.addMessage("animal", fallbackResponse)
      return fallbackResponse
    }

    try {
      const conversationContext = this.buildConversationContext(animal)
      
      const prompt = `你是一只名叫${animal.name}的${animal.species}，生活在新西兰的${animal.habitat}。

角色特征：
- 保护状态: ${animal.conservationStatus}
- 食物: ${animal.diet.join(", ")}
- 描述: ${animal.description}
- 亲密度等级: ${animal.intimacyLevel}

角色设定：
- 你是一只友好、聪明的${animal.name}
- 你喜欢和人类交流，但保持动物的天性
- 你了解新西兰的自然环境和生态
- 你关心保护和环境问题
- 根据亲密度等级调整友好程度（等级越高越亲密）
- 用第一人称说话，像一只真正的动物
- 回答要有趣、教育性，适合与儿童对话
- 回答长度控制在100字以内

对话历史：
${conversationContext}

用户说: ${userMessage}

请以${animal.name}的身份回复，用中文回答：`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
      })

      const animalResponse = text.trim()
      this.addMessage("animal", animalResponse)
      return animalResponse

    } catch (error) {
      console.error("Failed to chat with animal:", error)
      const fallbackResponse = this.getFallbackResponse(animal, userMessage)
      this.addMessage("animal", fallbackResponse)
      return fallbackResponse
    }
  }

  private addMessage(sender: "user" | "animal", message: string): void {
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      sender,
      message,
      timestamp: Date.now()
    }
    
    this.chatHistory.push(chatMessage)
    
    // Keep only last 10 messages to manage context size
    if (this.chatHistory.length > 10) {
      this.chatHistory = this.chatHistory.slice(-10)
    }
  }

  private buildConversationContext(animal: Animal): string {
    if (this.chatHistory.length === 0) return "这是你们第一次对话。"
    
    return this.chatHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.sender === "user" ? "用户" : animal.name}: ${msg.message}`)
      .join("\n")
  }

  private getFallbackResponse(animal: Animal, userMessage: string): string {
    const responses = [
      `你好！我是${animal.name}，很高兴见到你！我生活在${animal.habitat}。`,
      `作为一只${animal.species}，我最喜欢吃${animal.diet[0] || "各种食物"}了！`,
      `你知道吗？我们${animal.name}的保护状态是${animal.conservationStatus}，需要大家的保护哦！`,
      `${animal.description}这就是我们的特点！`,
      `我很喜欢和你聊天！你还想了解什么关于我的事情吗？`
    ]

    // Simple keyword matching for fallback
    if (userMessage.includes("你好") || userMessage.includes("hi")) {
      return responses[0]
    } else if (userMessage.includes("吃") || userMessage.includes("食物")) {
      return responses[1]
    } else if (userMessage.includes("保护") || userMessage.includes("环境")) {
      return responses[2]
    } else {
      return responses[Math.floor(Math.random() * responses.length)]
    }
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory]
  }

  clearChatHistory(): void {
    this.chatHistory = []
  }

  getLastAnimalMessage(): string | null {
    const lastAnimalMessage = this.chatHistory
      .slice()
      .reverse()
      .find(msg => msg.sender === "animal")
    return lastAnimalMessage ? lastAnimalMessage.message : null
  }
} 