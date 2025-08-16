import Phaser from "phaser"
import type { Animal } from "../GameState"
import { AIEducationService, type EducationalContent, type QuizQuestion } from "../services/AIEducationService"

export class BackpackScene extends Phaser.Scene {
  private gameManager: any
  private animalCards: Phaser.GameObjects.Container[] = []
  private selectedAnimal?: Animal
  private filterMode: "all" | "north" | "south" = "all"
  private sortMode: "name" | "intimacy" | "recent" = "name"
  private aiEducationService: AIEducationService

  constructor() {
    super({ key: "BackpackScene" })
  }

  create() {
    this.gameManager = this.game.gameManager
    this.aiEducationService = new AIEducationService()

    this.createBackground()
    this.createHeader()
    this.createFilterControls()
    this.createAnimalGrid()
    this.createDetailPanel()
  }

  private createBackground() {
    // Gradient background
    const bg = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x1a1a2e,
    )

    // Add subtle pattern
    const pattern = this.add
      .tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, "pixel-pattern")
      .setOrigin(0)
      .setAlpha(0.1)
  }

  private createHeader() {
    const headerContainer = this.add.container(this.cameras.main.centerX, 60)

    // Background panel
    const headerBg = this.add.rectangle(0, 0, 400, 80, 0x000000, 0.8).setStroke(0x4caf50, 2)

    // Title
    const title = this.add
      .text(0, -15, "动物收藏", {
        fontSize: "24px",
        color: "#4CAF50",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    // Stats
    const capturedAnimals = this.gameManager.getGameState().getCapturedAnimals()
    const totalAnimals = this.gameManager.getGameState().getAllAnimals().length

    const statsText = this.add
      .text(0, 15, `已收集: ${capturedAnimals.length}/${totalAnimals}`, {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    // Back button
    const backButton = this.add.container(-180, 0).setInteractive({ useHandCursor: true })

    const backBg = this.add.rectangle(0, 0, 80, 40, 0x333333, 0.9).setStroke(0xffffff, 1)

    const backText = this.add
      .text(0, 0, "← 返回", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    backButton.add([backBg, backText])
    backButton.on("pointerdown", () => {
      this.scene.start("MapScene")
    })

    headerContainer.add([headerBg, title, statsText, backButton])
  }

  private createFilterControls() {
    const controlsContainer = this.add.container(this.cameras.main.centerX, 140)

    // Filter buttons
    const filterButtons = [
      { key: "all", label: "全部" },
      { key: "north", label: "北岛" },
      { key: "south", label: "南岛" },
    ]

    filterButtons.forEach((filter, index) => {
      const x = (index - 1) * 100
      const button = this.createFilterButton(x, -20, filter.label, filter.key as any)
      controlsContainer.add(button)
    })

    // Sort buttons
    const sortButtons = [
      { key: "name", label: "名称" },
      { key: "intimacy", label: "亲密度" },
      { key: "recent", label: "最近" },
    ]

    sortButtons.forEach((sort, index) => {
      const x = (index - 1) * 100
      const button = this.createSortButton(x, 20, sort.label, sort.key as any)
      controlsContainer.add(button)
    })

    // Labels
    const filterLabel = this.add
      .text(-200, -20, "筛选:", {
        fontSize: "14px",
        color: "#cccccc",
      })
      .setOrigin(0, 0.5)

    const sortLabel = this.add
      .text(-200, 20, "排序:", {
        fontSize: "14px",
        color: "#cccccc",
      })
      .setOrigin(0, 0.5)

    controlsContainer.add([filterLabel, sortLabel])
  }

  private createFilterButton(
    x: number,
    y: number,
    label: string,
    mode: "all" | "north" | "south",
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y).setInteractive({ useHandCursor: true })

    const bg = this.add
      .rectangle(0, 0, 80, 30, this.filterMode === mode ? 0x4caf50 : 0x333333, 0.9)
      .setStroke(0x4caf50, 1)

    const text = this.add
      .text(0, 0, label, {
        fontSize: "12px",
        color: this.filterMode === mode ? "#000000" : "#ffffff",
      })
      .setOrigin(0.5)

    button.add([bg, text])
    button.on("pointerdown", () => {
      this.setFilter(mode)
    })

    return button
  }

  private createSortButton(
    x: number,
    y: number,
    label: string,
    mode: "name" | "intimacy" | "recent",
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y).setInteractive({ useHandCursor: true })

    const bg = this.add
      .rectangle(0, 0, 80, 30, this.sortMode === mode ? 0x2196f3 : 0x333333, 0.9)
      .setStroke(0x2196f3, 1)

    const text = this.add
      .text(0, 0, label, {
        fontSize: "12px",
        color: this.sortMode === mode ? "#000000" : "#ffffff",
      })
      .setOrigin(0.5)

    button.add([bg, text])
    button.on("pointerdown", () => {
      this.setSort(mode)
    })

    return button
  }

  private createAnimalGrid() {
    const startY = 200
    const capturedAnimals = this.getFilteredAndSortedAnimals()

    this.animalCards.forEach((card) => card.destroy())
    this.animalCards = []

    const cols = 3
    const cardWidth = 120
    const cardHeight = 160
    const spacing = 20
    const totalWidth = cols * cardWidth + (cols - 1) * spacing
    const startX = this.cameras.main.centerX - totalWidth / 2 + cardWidth / 2

    capturedAnimals.forEach((animal, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)

      const card = this.createAnimalCard(animal, x, y)
      this.animalCards.push(card)
    })

    // Empty state
    if (capturedAnimals.length === 0) {
      const emptyText = this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          this.filterMode === "all" ? "还没有收集到任何动物\n去地图上探索吧！" : "该区域还没有收集到动物",
          {
            fontSize: "18px",
            color: "#888888",
            align: "center",
          },
        )
        .setOrigin(0.5)

      this.animalCards.push(emptyText as any)
    }
  }

  private createAnimalCard(animal: Animal, x: number, y: number): Phaser.GameObjects.Container {
    const card = this.add.container(x, y).setInteractive({ useHandCursor: true })

    // Card background
    const cardBg = this.add.rectangle(0, 0, 120, 160, 0x2a2a3e, 0.95).setStroke(0x4caf50, 2)

    // Animal image
    const animalImage = this.add.image(0, -40, `${animal.id}-icon`).setScale(0.8)

    // Animal name
    const nameText = this.add
      .text(0, 20, animal.name, {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    // Intimacy level
    const intimacyContainer = this.createIntimacyDisplay(animal.intimacyLevel)
    intimacyContainer.setPosition(0, 45)

    // Conservation status indicator
    const statusColor = this.getStatusColor(animal.conservationStatus)
    const statusDot = this.add.circle(45, -65, 6, statusColor)

    // Hover effects
    card.on("pointerover", () => {
      this.tweens.add({
        targets: card,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: "Power2",
      })
      cardBg.setStroke(0x8bc34a, 3)
    })

    card.on("pointerout", () => {
      this.tweens.add({
        targets: card,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: "Power2",
      })
      cardBg.setStroke(0x4caf50, 2)
    })

    card.on("pointerdown", () => {
      this.selectAnimal(animal)
    })

    card.add([cardBg, animalImage, nameText, intimacyContainer, statusDot])
    return card
  }

  private createIntimacyDisplay(level: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0)

    const maxHearts = 5
    const heartSpacing = 15
    const startX = (-(maxHearts - 1) * heartSpacing) / 2

    for (let i = 0; i < maxHearts; i++) {
      const x = startX + i * heartSpacing
      const filled = i < Math.floor(level / 2)
      const half = i === Math.floor(level / 2) && level % 2 === 1

      let heartColor = 0x666666
      if (filled) heartColor = 0xff4444
      else if (half) heartColor = 0xff8888

      const heart = this.add
        .text(x, 0, "♥", {
          fontSize: "12px",
          color: Phaser.Display.Color.IntegerToHex(heartColor),
        })
        .setOrigin(0.5)

      container.add(heart)
    }

    return container
  }

  private getStatusColor(status: string): number {
    const colors: Record<string, number> = {
      极度濒危: 0xff0000,
      濒危: 0xff4444,
      易危: 0xff8800,
      近危: 0xffaa00,
      无危: 0x4caf50,
    }
    return colors[status] || 0x888888
  }

  private createDetailPanel() {
    // Detail panel will be created when an animal is selected
  }

  private selectAnimal(animal: Animal) {
    this.selectedAnimal = animal
    this.showAnimalDetail(animal)
  }

  private async showEducationalContent(animal: Animal) {
    const loadingContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(300)

    const loadingBg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.9).setStroke(0x4caf50, 2)
    const loadingText = this.add
      .text(0, 0, "正在生成教育内容...", {
        fontSize: "16px",
        color: "#4CAF50",
      })
      .setOrigin(0.5)

    loadingContainer.add([loadingBg, loadingText])

    try {
      const playerLevel = this.calculatePlayerLevel()
      const educationalContent = await this.aiEducationService.generateEducationalContent(animal, playerLevel)

      loadingContainer.destroy()
      this.displayEducationalContent(animal, educationalContent)
    } catch (error) {
      console.error("Failed to load educational content:", error)
      loadingContainer.destroy()
      this.showEducationError()
    }
  }

  private displayEducationalContent(animal: Animal, content: EducationalContent[]) {
    const eduContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(300)

    // Background
    const eduBg = this.add.rectangle(0, 0, 600, 500, 0x1a1a2e, 0.95).setStroke(0x4caf50, 3)

    // Header
    const headerContainer = this.add.container(0, -220)
    const headerBg = this.add.rectangle(0, 0, 580, 60, 0x4caf50, 0.2)
    const titleText = this.add
      .text(0, -10, `${animal.name} 学习中心`, {
        fontSize: "20px",
        color: "#4CAF50",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const subtitleText = this.add
      .text(0, 15, "探索有趣的知识和保护信息", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    headerContainer.add([headerBg, titleText, subtitleText])

    // Close button
    const closeButton = this.add
      .text(280, -220, "×", {
        fontSize: "24px",
        color: "#ff4444",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        eduContainer.destroy()
      })

    // Content tabs
    const tabContainer = this.add.container(0, -160)
    const tabs = ["学习", "测验", "问答"]
    const activeTab = 0

    const tabButtons = tabs.map((tab, index) => {
      const x = (index - 1) * 120
      const button = this.add.container(x, 0).setInteractive({ useHandCursor: true })

      const tabBg = this.add
        .rectangle(0, 0, 100, 30, index === activeTab ? 0x4caf50 : 0x333333, 0.9)
        .setStroke(0x4caf50, 1)

      const tabText = this.add
        .text(0, 0, tab, {
          fontSize: "14px",
          color: index === activeTab ? "#000000" : "#ffffff",
        })
        .setOrigin(0.5)

      button.add([tabBg, tabText])
      button.on("pointerdown", () => {
        this.switchEducationTab(eduContainer, index, animal, content)
      })

      return button
    })

    tabContainer.add(tabButtons)

    // Content area
    const contentArea = this.add.container(0, 0)
    this.displayLearningContent(contentArea, content)

    // Action buttons
    const actionContainer = this.add.container(0, 200)
    const quizButton = this.createActionButton(-100, 0, "开始测验", 0x2196f3, () => {
      this.startQuiz(animal)
    })

    const chatButton = this.createActionButton(100, 0, "AI问答", 0xff9800, () => {
      this.openAIChat(animal)
    })

    actionContainer.add([quizButton, chatButton])

    eduContainer.add([eduBg, headerContainer, closeButton, tabContainer, contentArea, actionContainer])

    // Animate in
    eduContainer.setScale(0)
    this.tweens.add({
      targets: eduContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.easeOut",
    })
  }

  private displayLearningContent(container: Phaser.GameObjects.Container, content: EducationalContent[]) {
    container.removeAll(true)

    const scrollContainer = this.add.container(0, -50)

    content.forEach((item, index) => {
      const y = index * 80
      const itemContainer = this.add.container(0, y)

      // Content type icon
      const typeColor = this.getContentTypeColor(item.type)
      const typeIcon = this.add.circle(-250, 0, 8, typeColor)

      // Content
      const contentBg = this.add.rectangle(0, 0, 480, 70, 0x2a2a3e, 0.8).setStroke(typeColor, 1)

      const topicText = this.add
        .text(-230, -20, item.topic, {
          fontSize: "14px",
          color: "#4CAF50",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5)

      const contentText = this.add
        .text(-230, 10, item.content, {
          fontSize: "12px",
          color: "#ffffff",
          wordWrap: { width: 450 },
        })
        .setOrigin(0, 0.5)

      itemContainer.add([typeIcon, contentBg, topicText, contentText])
      scrollContainer.add(itemContainer)
    })

    container.add(scrollContainer)
  }

  private getContentTypeColor(type: string): number {
    const colors = {
      fact: 0x2196f3,
      conservation: 0x4caf50,
      story: 0xff9800,
      quiz: 0x9c27b0,
    }
    return colors[type as keyof typeof colors] || 0x888888
  }

  private createActionButton(
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void,
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y).setInteractive({ useHandCursor: true })

    const buttonBg = this.add.rectangle(0, 0, 150, 40, color, 0.9).setStroke(color, 2)

    const buttonText = this.add
      .text(0, 0, text, {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    button.add([buttonBg, buttonText])
    button.on("pointerdown", callback)

    // Hover effect
    button.on("pointerover", () => {
      buttonBg.setFillStyle(color, 1)
    })

    button.on("pointerout", () => {
      buttonBg.setFillStyle(color, 0.9)
    })

    return button
  }

  private async startQuiz(animal: Animal) {
    const loadingText = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, "正在生成测验...", {
        fontSize: "16px",
        color: "#4CAF50",
      })
      .setOrigin(0.5)
      .setDepth(400)

    try {
      const difficulty = this.getDifficultyForAnimal(animal)
      const questions = await this.aiEducationService.generateQuiz(animal, difficulty)

      loadingText.destroy()
      this.displayQuiz(animal, questions)
    } catch (error) {
      console.error("Failed to generate quiz:", error)
      loadingText.destroy()
      this.showEducationError()
    }
  }

  private displayQuiz(animal: Animal, questions: QuizQuestion[]) {
    const quizContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(400)

    let currentQuestion = 0
    let score = 0

    const showQuestion = (questionIndex: number) => {
      quizContainer.removeAll(true)

      if (questionIndex >= questions.length) {
        this.showQuizResults(quizContainer, animal, score, questions.length)
        return
      }

      const question = questions[questionIndex]

      // Background
      const quizBg = this.add.rectangle(0, 0, 500, 400, 0x1a1a2e, 0.95).setStroke(0x2196f3, 3)

      // Progress
      const progressText = this.add
        .text(0, -180, `问题 ${questionIndex + 1}/${questions.length}`, {
          fontSize: "16px",
          color: "#2196F3",
        })
        .setOrigin(0.5)

      // Question
      const questionText = this.add
        .text(0, -120, question.question, {
          fontSize: "18px",
          color: "#ffffff",
          fontStyle: "bold",
          wordWrap: { width: 450 },
          align: "center",
        })
        .setOrigin(0.5)

      // Options
      const optionButtons = question.options.map((option, index) => {
        const y = -40 + index * 50
        const button = this.add.container(0, y).setInteractive({ useHandCursor: true })

        const optionBg = this.add.rectangle(0, 0, 400, 40, 0x333333, 0.9).setStroke(0x666666, 1)

        const optionText = this.add
          .text(0, 0, `${String.fromCharCode(65 + index)}. ${option}`, {
            fontSize: "14px",
            color: "#ffffff",
          })
          .setOrigin(0.5)

        button.add([optionBg, optionText])
        button.on("pointerdown", () => {
          this.handleQuizAnswer(quizContainer, question, index, () => {
            if (index === question.correctAnswer) score++
            currentQuestion++
            setTimeout(() => showQuestion(currentQuestion), 2000)
          })
        })

        return button
      })

      quizContainer.add([quizBg, progressText, questionText, ...optionButtons])
    }

    showQuestion(0)
  }

  private handleQuizAnswer(
    container: Phaser.GameObjects.Container,
    question: QuizQuestion,
    selectedIndex: number,
    callback: () => void,
  ) {
    const isCorrect = selectedIndex === question.correctAnswer

    // Show feedback
    const feedbackBg = this.add.rectangle(0, 120, 450, 80, isCorrect ? 0x4caf50 : 0xf44336, 0.9)

    const feedbackText = this.add
      .text(0, 100, isCorrect ? "正确！" : "不正确", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const explanationText = this.add
      .text(0, 140, question.explanation, {
        fontSize: "12px",
        color: "#ffffff",
        wordWrap: { width: 400 },
        align: "center",
      })
      .setOrigin(0.5)

    container.add([feedbackBg, feedbackText, explanationText])

    callback()
  }

  private showQuizResults(container: Phaser.GameObjects.Container, animal: Animal, score: number, total: number) {
    container.removeAll(true)

    const percentage = Math.round((score / total) * 100)
    let message = ""
    let color = "#4CAF50"

    if (percentage >= 80) {
      message = "太棒了！你对这个动物了解很深！"
      // Increase intimacy as reward
      animal.intimacyLevel = Math.min(animal.intimacyLevel + 2, 10)
    } else if (percentage >= 60) {
      message = "不错！继续学习会更好！"
      animal.intimacyLevel = Math.min(animal.intimacyLevel + 1, 10)
    } else {
      message = "继续努力！多了解这个动物吧！"
      color = "#FF9800"
    }

    const resultBg = this.add.rectangle(0, 0, 400, 300, 0x1a1a2e, 0.95).setStroke(color as any, 3)

    const scoreText = this.add
      .text(0, -80, `得分: ${score}/${total}`, {
        fontSize: "24px",
        color,
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const percentageText = this.add
      .text(0, -40, `${percentage}%`, {
        fontSize: "32px",
        color,
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const messageText = this.add
      .text(0, 20, message, {
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)

    const closeButton = this.add
      .text(0, 80, "完成", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: color,
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        container.destroy()
        this.createAnimalGrid() // Refresh to show updated intimacy
      })

    container.add([resultBg, scoreText, percentageText, messageText, closeButton])
  }

  private openAIChat(animal: Animal) {
    const chatContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(500)

    // Chat background
    const chatBg = this.add.rectangle(0, 0, 500, 400, 0x1a1a2e, 0.95).setStroke(0xff9800, 3)

    // Header
    const headerText = this.add
      .text(0, -180, `与AI聊聊${animal.name}`, {
        fontSize: "18px",
        color: "#FF9800",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    // Chat messages area
    const messagesContainer = this.add.container(0, -50)
    const messages: { text: string; isUser: boolean }[] = []

    // Input area
    const inputBg = this.add.rectangle(0, 150, 450, 40, 0x333333, 0.9).setStroke(0x666666, 1)

    const inputText = this.add
      .text(-200, 150, "输入你的问题...", {
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0, 0.5)

    // Send button
    const sendButton = this.add
      .text(180, 150, "发送", {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#FF9800",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    // Close button
    const closeButton = this.add
      .text(220, -180, "×", {
        fontSize: "20px",
        color: "#ff4444",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        chatContainer.destroy()
      })

    // Simple input handling (in a real app, you'd want proper text input)
    const predefinedQuestions = [
      `${animal.name}吃什么？`,
      `${animal.name}住在哪里？`,
      `如何保护${animal.name}？`,
      `${animal.name}有什么特别之处？`,
    ]

    let currentQuestionIndex = 0

    const askQuestion = async (question: string) => {
      // Add user message
      messages.push({ text: question, isUser: true })
      this.updateChatMessages(messagesContainer, messages)

      // Show typing indicator
      messages.push({ text: "AI正在思考...", isUser: false })
      this.updateChatMessages(messagesContainer, messages)

      try {
        const answer = await this.aiEducationService.answerQuestion(question, animal)
        messages.pop() // Remove typing indicator
        messages.push({ text: answer, isUser: false })
        this.updateChatMessages(messagesContainer, messages)
      } catch (error) {
        messages.pop() // Remove typing indicator
        messages.push({ text: "抱歉，我现在无法回答这个问题。请稍后再试！", isUser: false })
        this.updateChatMessages(messagesContainer, messages)
      }
    }

    sendButton.on("pointerdown", () => {
      if (currentQuestionIndex < predefinedQuestions.length) {
        const question = predefinedQuestions[currentQuestionIndex]
        inputText.setText(question)
        askQuestion(question)
        currentQuestionIndex++

        if (currentQuestionIndex < predefinedQuestions.length) {
          inputText.setText(predefinedQuestions[currentQuestionIndex])
        } else {
          inputText.setText("继续提问...")
        }
      }
    })

    // Initialize with first question
    inputText.setText(predefinedQuestions[0])

    chatContainer.add([chatBg, headerText, messagesContainer, inputBg, inputText, sendButton, closeButton])
  }

  private updateChatMessages(container: Phaser.GameObjects.Container, messages: { text: string; isUser: boolean }[]) {
    container.removeAll(true)

    const maxMessages = 4
    const recentMessages = messages.slice(-maxMessages)

    recentMessages.forEach((message, index) => {
      const y = (index - recentMessages.length / 2) * 40
      const x = message.isUser ? 100 : -100

      const messageBg = this.add.rectangle(x, y, 300, 35, message.isUser ? 0x2196f3 : 0x4caf50, 0.9)

      const messageText = this.add
        .text(x, y, message.text, {
          fontSize: "12px",
          color: "#ffffff",
          wordWrap: { width: 280 },
          align: message.isUser ? "right" : "left",
        })
        .setOrigin(0.5)

      container.add([messageBg, messageText])
    })
  }

  private switchEducationTab(
    container: Phaser.GameObjects.Container,
    tabIndex: number,
    animal: Animal,
    content: EducationalContent[],
  ) {
    // This would switch between different education modes
    // For now, just refresh the learning content
    const contentArea = container.getAt(3) as Phaser.GameObjects.Container
    this.displayLearningContent(contentArea, content)
  }

  private calculatePlayerLevel(): number {
    const capturedAnimals = this.gameManager.getGameState().getCapturedAnimals()
    const totalIntimacy = capturedAnimals.reduce((sum: number, animal: Animal) => sum + animal.intimacyLevel, 0)
    return Math.floor(totalIntimacy / 5) + 1
  }

  private getDifficultyForAnimal(animal: Animal): "beginner" | "intermediate" | "advanced" {
    if (animal.intimacyLevel <= 3) return "beginner"
    if (animal.intimacyLevel <= 7) return "intermediate"
    return "advanced"
  }

  private showEducationError() {
    const errorText = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, "无法加载教育内容\n请检查网络连接", {
        fontSize: "16px",
        color: "#ff4444",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(400)

    this.time.delayedCall(3000, () => {
      errorText.destroy()
    })
  }

  private setFilter(mode: "all" | "north" | "south") {
    this.filterMode = mode
    this.createFilterControls()
    this.createAnimalGrid()
  }

  private setSort(mode: "name" | "intimacy" | "recent") {
    this.sortMode = mode
    this.createFilterControls()
    this.createAnimalGrid()
  }

  private getFilteredAndSortedAnimals(): Animal[] {
    let animals = this.gameManager.getGameState().getCapturedAnimals()

    // Filter
    if (this.filterMode !== "all") {
      animals = animals.filter((animal: Animal) => animal.region === this.filterMode || animal.region === "both")
    }

    // Sort
    animals.sort((a: Animal, b: Animal) => {
      switch (this.sortMode) {
        case "name":
          return a.name.localeCompare(b.name)
        case "intimacy":
          return b.intimacyLevel - a.intimacyLevel
        case "recent":
          const aTime = a.lastFed ? new Date(a.lastFed).getTime() : 0
          const bTime = b.lastFed ? new Date(b.lastFed).getTime() : 0
          return bTime - aTime
        default:
          return 0
      }
    })

    return animals
  }
}
