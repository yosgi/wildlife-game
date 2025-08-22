import Phaser from "phaser"

export interface FoodItem {
  id: string
  name: string
  type: "insect" | "plant" | "fish" | "meat"
  sprite: string
  nutritionValue: number
}

export interface FeedingResult {
  success: boolean
  intimacyGain: number
  message: string
  effect?: "happy" | "neutral" | "dislike"
}

export class FeedingSystem {
  private scene: Phaser.Scene
  private foodItems: Map<string, FoodItem> = new Map()
  private draggedFood?: Phaser.GameObjects.Image
  private feedingZone?: Phaser.GameObjects.Zone
  private currentAnimal?: any

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.initializeFoodItems()
  }

  private initializeFoodItems() {
    const foods: FoodItem[] = [
      { id: "insects", name: "Insects", type: "insect", sprite: "food-insects", nutritionValue: 2 },
      { id: "worms", name: "Worms", type: "insect", sprite: "food-worms", nutritionValue: 3 },
      { id: "berries", name: "Berries", type: "plant", sprite: "food-berries", nutritionValue: 2 },
      { id: "leaves", name: "Leaves", type: "plant", sprite: "food-leaves", nutritionValue: 1 },
      { id: "flowers", name: "Flowers", type: "plant", sprite: "food-flowers", nutritionValue: 2 },
      { id: "fruits", name: "Fruits", type: "plant", sprite: "food-fruits", nutritionValue: 3 },
      { id: "fish", name: "Fish", type: "fish", sprite: "food-fish", nutritionValue: 4 },
      { id: "squid", name: "Squid", type: "fish", sprite: "food-squid", nutritionValue: 3 },
      { id: "small-reptiles", name: "Small reptiles", type: "meat", sprite: "food-reptiles", nutritionValue: 4 },
    ]

    foods.forEach((food) => {
      this.foodItems.set(food.id, food)
    })
  }

  createFeedingInterface(animal: any, x: number, y: number): Phaser.GameObjects.Container {
    this.currentAnimal = animal

    const container = this.scene.add.container(x, y)

    // Background panel
    const bg = this.scene.add.rectangle(0, 0, 300, 400, 0x000000, 0.9)
    const bgBorder = this.scene.add.rectangle(0, 0, 300, 400).setStrokeStyle(3, 0x4caf50)

    // Title
    const title = this.scene.add
      .text(0, -180, `Feed ${animal.name}`, {
        fontSize: "18px",
        color: "#4CAF50",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    // Animal preferences
    const dietText = this.scene.add
      .text(0, -150, `Likes: ${animal.diet.join("、")}`, {
        fontSize: "14px",
        color: "#ffffff",
        wordWrap: { width: 280 },
      })
      .setOrigin(0.5)

    // Food selection area
    const foodContainer = this.createFoodSelection(animal)
    foodContainer.setPosition(0, -50)

    // Feeding zone
    this.feedingZone = this.scene.add.zone(0, 80, 200, 100).setRectangleDropZone(200, 100).setData("animal", animal)

    const feedingZoneBg = this.scene.add.rectangle(0, 80, 200, 100, 0x4caf50, 0.2)
    const feedingZoneBorder = this.scene.add.rectangle(0, 80, 200, 100).setStrokeStyle(2, 0x4caf50)

    const feedingZoneText = this.scene.add
      .text(0, 80, "Drag food here", {
        fontSize: "14px",
        color: "#4CAF50",
      })
      .setOrigin(0.5)

    // Close button
    const closeButton = this.scene.add
      .text(120, -180, "×", {
        fontSize: "24px",
        color: "#ff4444",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.closeFeedingInterface(container)
      })

    container.add([bg, bgBorder, title, dietText, foodContainer, feedingZoneBg, feedingZoneBorder, feedingZoneText, closeButton])

    // Setup drop zone events
    this.setupDropZoneEvents()

    return container
  }

  private createFoodSelection(animal: any): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0)

    // Get available foods based on animal's diet
    const availableFoods = this.getAvailableFoods(animal)

    const cols = 3
    const spacing = 80

    availableFoods.forEach((food, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const x = (col - 1) * spacing
      const y = row * spacing

      const foodSprite = this.scene.add
        .image(x, y, food.sprite)
        .setScale(0.6)
        .setInteractive({ useHandCursor: true })
        .setData("food", food)

      // Add glow effect for preferred foods
      if (animal.diet.includes(food.name)) {
        const glow = this.scene.add.circle(x, y, 35, 0x4caf50, 0.3)
        container.add(glow)

        this.scene.tweens.add({
          targets: glow,
          alpha: 0.1,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        })
      }

      const foodLabel = this.scene.add
        .text(x, y + 40, food.name, {
          fontSize: "12px",
          color: "#ffffff",
        })
        .setOrigin(0.5)

      // Make food draggable
      this.scene.input.setDraggable(foodSprite)

      container.add([foodSprite, foodLabel])
    })

    return container
  }

  private getAvailableFoods(animal: any): FoodItem[] {
    // Return foods that match the animal's dietary preferences
    const animalDietTypes = this.mapDietToTypes(animal.diet)

    return Array.from(this.foodItems.values()).filter((food) => {
      return animalDietTypes.includes(food.type) || animal.diet.includes(food.name)
    })
  }

  private mapDietToTypes(diet: string[]): string[] {
    const typeMap: Record<string, string> = {
      Insects: "insect",
      Worms: "insect",
      Berries: "plant",
      Leaves: "plant",
      Flowers: "plant",
      Fruits: "plant",
      Fish: "fish",
      Squid: "fish",
      "Small reptiles": "meat",
    }

    return diet.map((item) => typeMap[item]).filter(Boolean)
  }

  private setupDropZoneEvents() {
    // Drag start
    this.scene.input.on("dragstart", (pointer: any, gameObject: Phaser.GameObjects.Image) => {
      this.draggedFood = gameObject
      gameObject.setTint(0x888888)
      gameObject.setScale(0.8)
    })

    // Drag
    this.scene.input.on("drag", (pointer: any, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
      gameObject.x = dragX
      gameObject.y = dragY
    })

    // Drop
    this.scene.input.on(
      "drop",
      (pointer: any, gameObject: Phaser.GameObjects.Image, dropZone: Phaser.GameObjects.Zone) => {
        if (dropZone === this.feedingZone) {
          const food = gameObject.getData("food") as FoodItem
          const animal = dropZone.getData("animal")

          this.performFeeding(animal, food, gameObject)
        } else {
          // Return to original position
          this.returnFoodToOriginalPosition(gameObject)
        }
      },
    )

    // Drag end (if not dropped on valid zone)
    this.scene.input.on("dragend", (pointer: any, gameObject: Phaser.GameObjects.Image, dropped: boolean) => {
      if (!dropped) {
        this.returnFoodToOriginalPosition(gameObject)
      }
    })
  }

  private returnFoodToOriginalPosition(gameObject: Phaser.GameObjects.Image) {
    gameObject.clearTint()
    gameObject.setScale(0.6)

    // Animate back to original position
    this.scene.tweens.add({
      targets: gameObject,
      x: gameObject.input?.dragStartX || gameObject.x,
      y: gameObject.input?.dragStartY || gameObject.y,
      duration: 300,
      ease: "Power2",
    })
  }

  private performFeeding(animal: any, food: FoodItem, foodSprite: Phaser.GameObjects.Image): void {
    const result = this.calculateFeedingResult(animal, food)

    // Animate food consumption
    this.scene.tweens.add({
      targets: foodSprite,
      scale: 0,
      alpha: 0,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        foodSprite.destroy()
      },
    })

    // Show feeding result
    this.showFeedingResult(result, animal, food)

    // Update game state if successful
    if (result.success) {
      const gameManager = (this.scene.game as any).gameManager
      if (gameManager) {
        gameManager.getGameState().feedAnimal(animal.id, food.name)
      }
    }
  }

  private calculateFeedingResult(animal: any, food: FoodItem): FeedingResult {
    const isPreferred = animal.diet.includes(food.name)
    const isCompatible = this.mapDietToTypes(animal.diet).includes(food.type)

    if (isPreferred) {
      return {
        success: true,
        intimacyGain: food.nutritionValue * 2,
        message: `${animal.name} loves ${food.name}!`,
        effect: "happy",
      }
    } else if (isCompatible) {
      return {
        success: true,
        intimacyGain: food.nutritionValue,
        message: `${animal.name} ate ${food.name}`,
        effect: "neutral",
      }
    } else {
      return {
        success: false,
        intimacyGain: 0,
        message: `${animal.name} doesn't like ${food.name}`,
        effect: "dislike",
      }
    }
  }

  private showFeedingResult(result: FeedingResult, animal: any, food: FoodItem): void {
    const centerX = this.scene.cameras.main.centerX
    const centerY = this.scene.cameras.main.centerY - 100

    // Result background
    const resultBg = this.scene.add
      .rectangle(centerX, centerY, 300, 100, 0x000000, 0.9)
      .setDepth(100)
    
    const resultBorder = this.scene.add
      .rectangle(centerX, centerY, 300, 100)
      .setStrokeStyle(2, result.success ? 0x4caf50 : 0xff4444)
      .setDepth(100)

    // Result text
    const resultText = this.scene.add
      .text(centerX, centerY - 15, result.message, {
        fontSize: "16px",
        color: result.success ? "#4CAF50" : "#ff4444",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100)

    // Intimacy gain (if successful)
    if (result.success && result.intimacyGain > 0) {
      const intimacyText = this.scene.add
        .text(centerX, centerY + 15, `Intimacy +${result.intimacyGain}`, {
          fontSize: "14px",
          color: "#ffffff",
        })
        .setOrigin(0.5)
        .setDepth(100)

      // Animate intimacy gain
      this.scene.tweens.add({
        targets: intimacyText,
        y: centerY - 20,
        alpha: 0,
        duration: 1500,
        ease: "Power2",
      })
    }

    // Particle effects
    this.createFeedingParticles(centerX, centerY, result.effect || "neutral")

    // Auto-hide result
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: [resultBg, resultBorder, resultText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          resultBg.destroy()
          resultBorder.destroy()
          resultText.destroy()
        },
      })
    })
  }

  private createFeedingParticles(x: number, y: number, effect: "happy" | "neutral" | "dislike"): void {
    const colors = {
      happy: [0x4caf50, 0x8bc34a, 0xcddc39],
      neutral: [0x2196f3, 0x03a9f4, 0x00bcd4],
      dislike: [0xf44336, 0xff5722, 0xff9800],
    }

    const particleColors = colors[effect]

    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add
        .circle(
          x + Phaser.Math.Between(-20, 20),
          y + Phaser.Math.Between(-20, 20),
          Phaser.Math.Between(3, 8),
          particleColors[Math.floor(Math.random() * particleColors.length)],
        )
        .setDepth(99)

      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-100, -50),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(800, 1200),
        ease: "Power2",
        onComplete: () => particle.destroy(),
      })
    }
  }

  private closeFeedingInterface(container: Phaser.GameObjects.Container): void {
    this.scene.tweens.add({
      targets: container,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        container.destroy()
        this.cleanup()
      },
    })
  }

  private cleanup(): void {
    this.draggedFood = undefined
    this.feedingZone = undefined
    this.currentAnimal = undefined

    // Remove drag event listeners
    this.scene.input.removeAllListeners("dragstart")
    this.scene.input.removeAllListeners("drag")
    this.scene.input.removeAllListeners("drop")
    this.scene.input.removeAllListeners("dragend")
  }

  destroy(): void {
    this.cleanup()
    this.foodItems.clear()
  }
}
