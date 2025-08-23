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
    this.addMessage("user", userMessage)

    if (!this.apiKey) {
      const fallbackResponse = this.getFallbackResponse(animal, userMessage)
      this.addMessage("animal", fallbackResponse)
      return fallbackResponse
    }

    try {
      const conversationContext = this.buildConversationContext(animal)
      const prompt = `You are a ${animal.species} named ${animal.name}, living in the ${animal.habitat} of New Zealand.

Character traits:
- Conservation status: ${animal.conservationStatus}
- Diet: ${animal.diet.join(", ")}
- Description: ${animal.description}
- Intimacy level: ${animal.intimacyLevel}

Character settings:
- You are a friendly and smart ${animal.name}
- You like to communicate with humans, but keep your animal nature
- You know about New Zealand's natural environment and ecology
- You care about conservation and environmental issues
- Adjust friendliness according to intimacy level (the higher the level, the closer)
- Speak in first person, like a real animal
- Answers should be fun and educational, suitable for children
- Keep answers under 100 words

Conversation history:
${conversationContext}

User says: ${userMessage}

Please reply as ${animal.name}, in English:`

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
    if (this.chatHistory.length === 0) return "This is your first conversation."
    return this.chatHistory
      .slice(-6)
      .map(msg => `${msg.sender === "user" ? "User" : animal.name}: ${msg.message}`)
      .join("\n")
  }

  private getFallbackResponse(animal: Animal, userMessage: string): string {
    const responses = [
      `Hello! I'm ${animal.name}, nice to meet you! I live in the ${animal.habitat}.`,
      `As a ${animal.species}, my favorite food is ${animal.diet[0] || "various foods"}!`,
      `Did you know? Our conservation status is ${animal.conservationStatus}, we need everyone's help!`,
      `${animal.description} That's what makes us special!`,
      `I love chatting with you! Do you want to know more about me?`
    ]

    if (userMessage.includes("hello") || userMessage.includes("hi")) {
      return responses[0]
    } else if (userMessage.includes("eat") || userMessage.includes("food")) {
      return responses[1]
    } else if (userMessage.includes("conservation") || userMessage.includes("environment")) {
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