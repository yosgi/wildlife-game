import Phaser from "phaser"

export class MainMenuScene extends Phaser.Scene {
  private gameManager: any
  private backgroundImage!: Phaser.GameObjects.Image
  private backpackButton!: Phaser.GameObjects.Container
  private mapButton!: Phaser.GameObjects.Container
  private titleText!: Phaser.GameObjects.Text

  // Safe haptic feedback function
  private safeVibrate(duration: number = 50) {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(duration)
      } catch (error) {
        console.log('Vibration not supported:', error)
      }
    }
  }

  constructor() {
    super({ key: "MainMenuScene" })
  }

  preload() {
    // Background images
    this.load.image("main-bg", "/pixelated-south-island.png")
    
    // UI elements
    this.load.image("pixel-button", "/pixel-button.png")
  }

  create() {
    this.gameManager = this.registry.get("gameManager")
    console.log("MainMenuScene gameManager:", this.gameManager)

    // Create background
    this.createBackground()
    
    // Create title
    this.createTitle()
    
    // Create buttons
    this.createButtons()
  }

  private createBackground() {
    // Add background image
    this.backgroundImage = this.add.image(0, 0, "main-bg")
    this.backgroundImage.setOrigin(0, 0)
    
    // Adjust background size to fit screen
    const scaleX = this.cameras.main.width / this.backgroundImage.width
    const scaleY = this.cameras.main.height / this.backgroundImage.height
    const scale = Math.max(scaleX, scaleY)
    this.backgroundImage.setScale(scale)
    
    // Center background
    this.backgroundImage.setPosition(
      (this.cameras.main.width - this.backgroundImage.displayWidth) / 2,
      (this.cameras.main.height - this.backgroundImage.displayHeight) / 2
    )

    // Add color filter for atmosphere
    this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x1a1a2e,
      0.3
    )
  }

  private createTitle() {
    // Main title - mobile adaptation
    const titleSize = this.cameras.main.width < 768 ? "36px" : "48px"
    this.titleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height * 0.15,
      "🇳 New Zealand Wildlife Adventure",
      {
        fontSize: titleSize,
        color: "#4CAF50",
        fontFamily: "'Courier New', monospace",
        fontStyle: "bold",
        align: "center",
      }
    )
    this.titleText.setOrigin(0.5)
    this.titleText.setShadow(4, 4, "#1a1a2e", 8, true, true)

    // Subtitle - mobile adaptation
    const subtitleSize = this.cameras.main.width < 768 ? "18px" : "24px"
    const subtitle = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height * 0.22,
      "Explore, Collect, Learn",
      {
        fontSize: subtitleSize,
        color: "#ffffff",
        fontFamily: "'Courier New', monospace",
        align: "center",
      }
    )
    subtitle.setOrigin(0.5)
    subtitle.setShadow(2, 2, "#000000", 4, true, true)

    // Title blinking effect
    this.tweens.add({
      targets: this.titleText,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    })
  }

  private createButtons() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY

    // Mobile button layout adaptation
    const isMobile = this.cameras.main.width < 768
    const buttonSpacing = isMobile ? 0 : 300
    const buttonY = isMobile ? centerY + 50 : centerY + 100

    // Backpack button
    this.backpackButton = this.createPixelButton(
      centerX - (buttonSpacing / 2),
      buttonY,
      "Animal Collection",
      0x4CAF50,
      () => this.openBackpack(),
      isMobile
    )

    // Map button
    this.mapButton = this.createPixelButton(
      centerX + (buttonSpacing / 2),
      buttonY + (isMobile ? 100 : 0),
      "Explore Map",
      0x2196F3,
      () => this.openMap(),
      isMobile
    )

    // Add statistics to buttons
    this.updateButtonStats()
  }

  private createPixelButton(
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void,
    isMobile: boolean = false
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y)
    
    // Mobile button size adaptation
    const buttonWidth = isMobile ? 280 : 260
    const buttonHeight = isMobile ? 90 : 80
    const fontSize = isMobile ? "20px" : "18px"
    
    // Button background - multi-layer pixel effect
    const bgLarge = this.add.rectangle(0, 0, buttonWidth, buttonHeight, color, 0.9)
    const bgMedium = this.add.rectangle(0, 0, buttonWidth - 10, buttonHeight - 10, color, 1)
    const bgSmall = this.add.rectangle(0, 0, buttonWidth - 20, buttonHeight - 20, 0xffffff, 0.1)
    
    // Border effect
    const border1 = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0)
    border1.setStrokeStyle(4, 0x000000)
    
    const border2 = this.add.rectangle(0, 0, buttonWidth - 10, buttonHeight - 10, 0x000000, 0)
    border2.setStrokeStyle(2, 0xffffff, 0.3)

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: fontSize,
      color: "#000000",
      fontFamily: "'Courier New', monospace",
      fontStyle: "bold",
    })
    buttonText.setOrigin(0.5)
    buttonText.setShadow(1, 1, "#ffffff", 2, true, true)

    // Assemble button
    button.add([bgLarge, bgMedium, bgSmall, border1, border2, buttonText])
    
    // Set interaction - mobile increase hit area
    const hitAreaWidth = isMobile ? buttonWidth + 20 : buttonWidth
    const hitAreaHeight = isMobile ? buttonHeight + 20 : buttonHeight
    button.setSize(hitAreaWidth, hitAreaHeight)
    button.setInteractive({ useHandCursor: true })

    // Hover effect - mobile reduce animation amplitude
    const hoverScale = isMobile ? 1.05 : 1.1
    button.on("pointerover", () => {
      this.tweens.add({
        targets: button,
        scaleX: hoverScale,
        scaleY: hoverScale,
        duration: 200,
        ease: "Back.easeOut"
      })
      
      // Button glow effect
      bgMedium.setFillStyle(0xffffff, 0.8)
    })

    button.on("pointerout", () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: "Back.easeOut"
      })
      
      bgMedium.setFillStyle(color, 1)
    })

    // Click effect - mobile optimization
    button.on("pointerdown", () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: "Back.easeOut"
      })
      
      // Mobile add haptic feedback
      this.safeVibrate()
      
      callback()
    })

    // Save text element reference
    button.setData("textElement", buttonText)

    return button
  }

  private updateButtonStats() {
    if (!this.gameManager) return

    const gameState = this.gameManager.getGameState()
    const capturedAnimals = gameState.getCapturedAnimals()
    const totalAnimals = gameState.getAllAnimals().length

    // Update backpack button text
    const backpackText = this.backpackButton.getData("textElement") as Phaser.GameObjects.Text
    if (backpackText) {
      backpackText.setText(`Animal Collection (${capturedAnimals.length}/${totalAnimals})`)
    }

    // Update map button text
    const mapText = this.mapButton.getData("textElement") as Phaser.GameObjects.Text
    if (mapText) {
      mapText.setText(" Explore Map")
    }
  }

  private openBackpack() {
    console.log("Opening backpack...")
    if (this.gameManager) {
      this.gameManager.getGameState().setCurrentMode("backpack")
      this.scene.start("BackpackScene")
    }
  }

  private openMap() {
    console.log("Opening map...")
    if (this.gameManager) {
      this.gameManager.getGameState().setCurrentMode("map")
      this.scene.start("MapScene")
    }
  }
}
