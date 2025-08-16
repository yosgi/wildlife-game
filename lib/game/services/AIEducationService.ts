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

      const prompt = `作为新西兰动物保护专家，为${animal.name}(${animal.species})生成教育内容。
      
动物信息：
- 栖息地：${animal.habitat}
- 饮食：${animal.diet.join("、")}
- 保护状态：${animal.conservationStatus}
- 描述：${animal.description}

请生成3-4个不同类型的教育内容，难度级别：${difficulty}

格式要求：
1. 有趣的事实
2. 保护知识
3. 生态故事
4. 互动问题

每个内容应该适合${difficulty}级别，内容要准确、有趣且具有教育意义。`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        maxTokens: 1000,
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
      const prompt = `为${animal.name}(${animal.species})创建一个${difficulty}级别的测验。

动物信息：
- 栖息地：${animal.habitat}
- 饮食：${animal.diet.join("、")}
- 保护状态：${animal.conservationStatus}
- 描述：${animal.description}

请生成3个选择题，每题4个选项，包含正确答案和解释。
格式：JSON数组，每个问题包含question, options, correctAnswer(索引), explanation字段。`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        maxTokens: 800,
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
      const context = animal ? `关于${animal.name}(${animal.species})的问题：` : "关于新西兰动物的问题："

      const prompt = `${context}

问题：${question}

请提供准确、有趣且适合儿童理解的答案。如果问题与新西兰动物保护相关，请重点介绍保护知识。答案应该在150字以内。`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        maxTokens: 300,
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
      recommendations.push("开始探索新西兰的北岛或南岛，发现你的第一只动物！")
    } else if (capturedAnimals.length < 2) {
      recommendations.push("继续探索，还有更多神奇的动物等待发现！")
    }

    // Based on intimacy levels
    const lowIntimacyAnimals = capturedAnimals.filter((a) => a.intimacyLevel < 3)
    if (lowIntimacyAnimals.length > 0) {
      recommendations.push(`多与${lowIntimacyAnimals[0].name}互动，增加亲密度可以解锁更多内容！`)
    }

    // Conservation awareness
    const endangeredAnimals = capturedAnimals.filter(
      (a) => a.conservationStatus === "极度濒危" || a.conservationStatus === "濒危",
    )
    if (endangeredAnimals.length > 0) {
      recommendations.push(`了解${endangeredAnimals[0].name}的保护状况，学习如何帮助保护它们！`)
    }

    // Region-based recommendations
    const northAnimals = capturedAnimals.filter((a) => a.region === "north" || a.region === "both")
    const southAnimals = capturedAnimals.filter((a) => a.region === "south" || a.region === "both")

    if (northAnimals.length > southAnimals.length) {
      recommendations.push("尝试探索南岛，发现不同的动物种类！")
    } else if (southAnimals.length > northAnimals.length) {
      recommendations.push("北岛还有很多动物等待你的发现！")
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

        if (content.includes("保护") || content.includes("濒危")) type = "conservation"
        else if (content.includes("故事") || content.includes("传说")) type = "story"
        else if (content.includes("问题") || content.includes("测验")) type = "quiz"

        return {
          topic: `内容 ${index + 1}`,
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
      name: "动物",
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
        topic: "基本信息",
        content: `${animal.name}是新西兰的本土动物，生活在${animal.habitat}中。它们主要以${animal.diet.join("、")}为食。`,
        difficulty: "beginner",
        type: "fact",
      },
      {
        topic: "保护状况",
        content: `${animal.name}目前的保护状况是${animal.conservationStatus}。我们需要保护它们的栖息地，确保这些珍贵的动物能够继续生存。`,
        difficulty: "beginner",
        type: "conservation",
      },
      {
        topic: "有趣事实",
        content: `${animal.description}这使得${animal.name}成为新西兰独特生态系统中的重要组成部分。`,
        difficulty: "beginner",
        type: "fact",
      },
    ]
  }

  private getFallbackQuiz(animal: Animal): QuizQuestion[] {
    return [
      {
        question: `${animal.name}主要生活在哪里？`,
        options: [animal.habitat, "城市", "沙漠", "北极"],
        correctAnswer: 0,
        explanation: `${animal.name}的主要栖息地是${animal.habitat}。`,
      },
      {
        question: `${animal.name}的保护状况是什么？`,
        options: ["无危", animal.conservationStatus, "已灭绝", "未评估"],
        correctAnswer: 1,
        explanation: `${animal.name}目前被列为${animal.conservationStatus}。`,
      },
    ]
  }

  private getFallbackAnswer(question: string, animal?: Animal): string {
    if (animal) {
      return `关于${animal.name}：${animal.description} 它们生活在${animal.habitat}，主要以${animal.diet.join("、")}为食。如果你想了解更多，可以尝试与${animal.name}互动来增加亲密度！`
    }
    return "这是一个关于新西兰动物的有趣问题！新西兰有许多独特的本土动物，如几维鸟、鸮鹦鹉等。继续探索游戏来了解更多吧！"
  }
}
