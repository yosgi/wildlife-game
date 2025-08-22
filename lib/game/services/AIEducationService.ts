import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Animal } from "../GameState"

export interface EducationalContent {
  topic: string
  content: string
  difficulty: "beginner" | "intermediate" | "advanced"
  type: "fact" | "quiz" | "story" | "conservation"
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export class AIEducationService {
  private apiKey?: string

  constructor() {
    // In a real app, this would come from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  }

  async generateEducationalContent(animal: Animal, playerLevel = 1): Promise<EducationalContent[]> {
    if (!this.apiKey) {
      return this.getFallbackContent(animal)
    }

    try {
      const difficulty = this.getDifficultyLevel(playerLevel)

      const prompt = `As a New Zealand wildlife conservation expert, generate educational content for ${animal.name} (${animal.species}).
      
Animal information:
- Habitat: ${animal.habitat}
- Diet: ${animal.diet.join(", ")}
- Conservation status: ${animal.conservationStatus}
- Description: ${animal.description}

Please generate 3-4 different types of educational content, difficulty level: ${difficulty}

Format requirements:
1. Interesting facts
2. Conservation knowledge
3. Ecological stories
4. Interactive questions

Each content should be appropriate for ${difficulty} level, accurate, interesting and educational.`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
      })

      return this.parseEducationalContent(text, difficulty)
    } catch (error) {
      console.error("Failed to generate educational content:", error)
      return this.getFallbackContent(animal)
    }
  }

  async generateQuiz(
    animal: Animal,
    difficulty: "beginner" | "intermediate" | "advanced" = "beginner",
  ): Promise<QuizQuestion[]> {
    if (!this.apiKey) {
      return this.getFallbackQuiz(animal)
    }

    try {
      const prompt = `Create a ${difficulty} level quiz for ${animal.name} (${animal.species}).

Animal information:
- Habitat: ${animal.habitat}
- Diet: ${animal.diet.join(", ")}
- Conservation status: ${animal.conservationStatus}
- Description: ${animal.description}

Please generate 3 multiple choice questions, each with 4 options, including correct answer and explanation.
Format: JSON array, each question contains question, options, correctAnswer (index), explanation fields.`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
      })

      return this.parseQuizQuestions(text)
    } catch (error) {
      console.error("Failed to generate quiz:", error)
      return this.getFallbackQuiz(animal)
    }
  }

  async answerQuestion(question: string, animal?: Animal): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackAnswer(question, animal)
    }

    try {
      const context = animal ? `Question about ${animal.name} (${animal.species}):` : "Question about New Zealand wildlife:"

      const prompt = `${context}

Question: ${question}

Please provide an accurate, interesting answer suitable for children to understand. If the question is related to New Zealand wildlife conservation, focus on conservation knowledge. Answer should be within 150 words.`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
      })

      return text.trim()
    } catch (error) {
      console.error("Failed to answer question:", error)
      return this.getFallbackAnswer(question, animal)
    }
  }

  async generateRecommendations(capturedAnimals: Animal[], playerBehavior: any): Promise<string[]> {
    const recommendations = []

    // Based on captured animals
    if (capturedAnimals.length === 0) {
      recommendations.push("Start exploring New Zealand's North or South Island to discover your first animal!")
    } else if (capturedAnimals.length < 2) {
      recommendations.push("Continue exploring, there are more amazing animals waiting to be discovered!")
    }

    // Based on intimacy levels
    const lowIntimacyAnimals = capturedAnimals.filter((a) => a.intimacyLevel < 3)
    if (lowIntimacyAnimals.length > 0) {
      recommendations.push(`Interact more with ${lowIntimacyAnimals[0].name} to increase intimacy and unlock more content!`)
    }

    // Conservation awareness
    const endangeredAnimals = capturedAnimals.filter(
      (a) => a.conservationStatus === "Critically Endangered" || a.conservationStatus === "Endangered",
    )
    if (endangeredAnimals.length > 0) {
      recommendations.push(`Learn about ${endangeredAnimals[0].name}'s conservation status and how to help protect them!`)
    }

    // Region-based recommendations
    const northAnimals = capturedAnimals.filter((a) => a.region === "north" || a.region === "both")
    const southAnimals = capturedAnimals.filter((a) => a.region === "south" || a.region === "both")

    if (northAnimals.length > southAnimals.length) {
      recommendations.push("Try exploring the South Island to discover different animal species!")
    } else if (southAnimals.length > northAnimals.length) {
      recommendations.push("The North Island still has many animals waiting for your discovery!")
    }

    return recommendations.slice(0, 3) // Return top 3 recommendations
  }

  private getDifficultyLevel(playerLevel: number): "beginner" | "intermediate" | "advanced" {
    if (playerLevel <= 2) return "beginner"
    if (playerLevel <= 5) return "intermediate"
    return "advanced"
  }

  private parseEducationalContent(
    text: string,
    difficulty: "beginner" | "intermediate" | "advanced",
  ): EducationalContent[] {
    // Simple parsing - in a real app, you'd want more robust parsing
    const sections = text.split(/\d+\./).filter((s) => s.trim())

    return sections
      .map((section, index) => {
        const content = section.trim()
        let type: "fact" | "quiz" | "story" | "conservation" = "fact"

        if (content.includes("conservation") || content.includes("endangered")) type = "conservation"
        else if (content.includes("story") || content.includes("legend")) type = "story"
        else if (content.includes("question") || content.includes("quiz")) type = "quiz"

        return {
          topic: `Content ${index + 1}`,
          content,
          difficulty,
          type,
        }
      })
      .slice(0, 4)
  }

  private parseQuizQuestions(text: string): QuizQuestion[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 3)
      }
    } catch (e) {
      // Fallback parsing
    }

    return this.getFallbackQuiz({
      id: "fallback",
      name: "Animal",
      species: "",
      region: "north",
      habitat: "",
      diet: [],
      conservationStatus: "",
      description: "",
      intimacyLevel: 0,
      captured: false,
    } as Animal)
  }

  private getFallbackContent(animal: Animal): EducationalContent[] {
    return [
      {
        topic: "Basic Information",
        content: `${animal.name} is a native animal of New Zealand, living in ${animal.habitat}. They mainly feed on ${animal.diet.join(", ")}.`,
        difficulty: "beginner",
        type: "fact",
      },
      {
        topic: "Conservation Status",
        content: `${animal.name} currently has a conservation status of ${animal.conservationStatus}. We need to protect their habitat to ensure these precious animals can continue to survive.`,
        difficulty: "beginner",
        type: "conservation",
      },
      {
        topic: "Interesting Facts",
        content: `${animal.description} This makes ${animal.name} an important part of New Zealand's unique ecosystem.`,
        difficulty: "beginner",
        type: "fact",
      },
    ]
  }

  private getFallbackQuiz(animal: Animal): QuizQuestion[] {
    return [
      {
        question: `Where does ${animal.name} mainly live?`,
        options: [animal.habitat, "City", "Desert", "Arctic"],
        correctAnswer: 0,
        explanation: `${animal.name}'s main habitat is ${animal.habitat}.`,
      },
      {
        question: `What is ${animal.name}'s conservation status?`,
        options: ["Least Concern", animal.conservationStatus, "Extinct", "Not Evaluated"],
        correctAnswer: 1,
        explanation: `${animal.name} is currently listed as ${animal.conservationStatus}.`,
      },
    ]
  }

  private getFallbackAnswer(question: string, animal?: Animal): string {
    if (animal) {
      return `About ${animal.name}: ${animal.description} They live in ${animal.habitat} and mainly feed on ${animal.diet.join(", ")}. If you want to learn more, try interacting with ${animal.name} to increase intimacy!`
    }
    return "This is an interesting question about New Zealand wildlife! New Zealand has many unique native animals, such as kiwi, kakapo, and more. Continue exploring the game to learn more!"
  }
}
