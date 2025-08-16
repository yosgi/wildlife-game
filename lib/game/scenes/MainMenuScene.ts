import Phaser from "phaser"

export class MainMenuScene extends Phaser.Scene {
  private gameManager: any
  private backgroundImage!: Phaser.GameObjects.Image
  private backpackButton!: Phaser.GameObjects.Container
  private mapButton!: Phaser.GameObjects.Container
  private titleText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: "MainMenuScene" })
  }

  preload() {
    // 背景图片
    this.load.image("main-bg", "/pixelated-south-island.png")
    
    // UI元素
    this.load.image("pixel-button", "/pixel-button.png")
  }

  create() {
    this.gameManager = this.registry.get("gameManager")
    console.log("MainMenuScene gameManager:", this.gameManager)

    // 创建背景
    this.createBackground()
    
    // 创建标题
    this.createTitle()
    
    // 创建按钮
    this.createButtons()
  }

  private createBackground() {
    // 添加背景图片
    this.backgroundImage = this.add.image(0, 0, "main-bg")
    this.backgroundImage.setOrigin(0, 0)
    
    // 调整背景大小以适应屏幕
    const scaleX = this.cameras.main.width / this.backgroundImage.width
    const scaleY = this.cameras.main.height / this.backgroundImage.height
    const scale = Math.max(scaleX, scaleY)
    this.backgroundImage.setScale(scale)
    
    // 居中背景
    this.backgroundImage.setPosition(
      (this.cameras.main.width - this.backgroundImage.displayWidth) / 2,
      (this.cameras.main.height - this.backgroundImage.displayHeight) / 2
    )

    // 添加颜色滤镜营造氛围
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
    // 主标题 - 移动端适配
    const titleSize = this.cameras.main.width < 768 ? "36px" : "48px"
    this.titleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height * 0.15,
      "🇳🇿 新西兰动物探险",
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

    // 副标题 - 移动端适配
    const subtitleSize = this.cameras.main.width < 768 ? "18px" : "24px"
    const subtitle = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height * 0.22,
      "探索、收集、学习",
      {
        fontSize: subtitleSize,
        color: "#ffffff",
        fontFamily: "'Courier New', monospace",
        align: "center",
      }
    )
    subtitle.setOrigin(0.5)
    subtitle.setShadow(2, 2, "#000000", 4, true, true)

    // 标题闪烁效果
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

    // 移动端按钮布局适配
    const isMobile = this.cameras.main.width < 768
    const buttonSpacing = isMobile ? 0 : 300
    const buttonY = isMobile ? centerY + 50 : centerY + 100

    // 背包按钮
    this.backpackButton = this.createPixelButton(
      centerX - (buttonSpacing / 2),
      buttonY,
      "🎒 动物收藏",
      0x4CAF50,
      () => this.openBackpack(),
      isMobile
    )

    // 地图按钮
    this.mapButton = this.createPixelButton(
      centerX + (buttonSpacing / 2),
      buttonY + (isMobile ? 100 : 0),
      "🗺️ 探索地图",
      0x2196F3,
      () => this.openMap(),
      isMobile
    )

    // 为按钮添加统计信息
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
    
    // 移动端按钮尺寸适配
    const buttonWidth = isMobile ? 280 : 260
    const buttonHeight = isMobile ? 90 : 80
    const fontSize = isMobile ? "20px" : "18px"
    
    // 按钮背景 - 多层像素效果
    const bgLarge = this.add.rectangle(0, 0, buttonWidth, buttonHeight, color, 0.9)
    const bgMedium = this.add.rectangle(0, 0, buttonWidth - 10, buttonHeight - 10, color, 1)
    const bgSmall = this.add.rectangle(0, 0, buttonWidth - 20, buttonHeight - 20, 0xffffff, 0.1)
    
    // 边框效果
    const border1 = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0)
    border1.setStrokeStyle(4, 0x000000)
    
    const border2 = this.add.rectangle(0, 0, buttonWidth - 10, buttonHeight - 10, 0x000000, 0)
    border2.setStrokeStyle(2, 0xffffff, 0.3)

    // 按钮文字
    const buttonText = this.add.text(0, 0, text, {
      fontSize: fontSize,
      color: "#000000",
      fontFamily: "'Courier New', monospace",
      fontStyle: "bold",
    })
    buttonText.setOrigin(0.5)
    buttonText.setShadow(1, 1, "#ffffff", 2, true, true)

    // 组装按钮
    button.add([bgLarge, bgMedium, bgSmall, border1, border2, buttonText])
    
    // 设置交互 - 移动端增加点击区域
    const hitAreaWidth = isMobile ? buttonWidth + 20 : buttonWidth
    const hitAreaHeight = isMobile ? buttonHeight + 20 : buttonHeight
    button.setSize(hitAreaWidth, hitAreaHeight)
    button.setInteractive({ useHandCursor: true })

    // 悬停效果 - 移动端减少动画幅度
    const hoverScale = isMobile ? 1.05 : 1.1
    button.on("pointerover", () => {
      this.tweens.add({
        targets: button,
        scaleX: hoverScale,
        scaleY: hoverScale,
        duration: 200,
        ease: "Back.easeOut"
      })
      
      // 按钮发光效果
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

    // 点击效果 - 移动端优化
    button.on("pointerdown", () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: "Back.easeOut"
      })
      
      // 移动端添加触觉反馈
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
      
      callback()
    })

    // 保存文字元素的引用
    button.setData("textElement", buttonText)

    return button
  }

  private updateButtonStats() {
    if (!this.gameManager) return

    const gameState = this.gameManager.getGameState()
    const capturedAnimals = gameState.getCapturedAnimals()
    const totalAnimals = gameState.getAllAnimals().length

    // 更新背包按钮文字
    const backpackText = this.backpackButton.getData("textElement") as Phaser.GameObjects.Text
    if (backpackText) {
      backpackText.setText(`🎒 动物收藏 (${capturedAnimals.length}/${totalAnimals})`)
    }

    // 更新地图按钮文字
    const mapText = this.mapButton.getData("textElement") as Phaser.GameObjects.Text
    if (mapText) {
      mapText.setText("🗺️ 探索地图")
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
