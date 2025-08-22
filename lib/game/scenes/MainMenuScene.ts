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
    this.load.image("cloud", "/pixel-cloud.png")
    this.load.image("cloud1", "/cloud1.png")
    this.load.image("wave", "/pixel-wave.png")
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
    
    // 创建装饰性动画
    this.createAnimations()
    
    // 创建入场动画
    this.createIntroAnimation()
  }

  private createBackground() {
    // 添加背景图片
    this.backgroundImage = this.add.image(0, 0, "main-bg")
    this.backgroundImage.setOrigin(0, 0)
    
    // 只按宽度缩放以占满宽度，保持纵横比
    const scaleX = this.cameras.main.width / this.backgroundImage.width
    this.backgroundImage.setScale(scaleX)
    
    // 居中背景（只在Y轴居中，X轴占满）
    this.backgroundImage.setPosition(
      0, // X轴从0开始，占满宽度
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
    // 主标题
    this.titleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height * 0.2,
      "WildQuest",
      {
        fontSize: "48px",
        color: "#4CAF50",
        fontFamily: "'Courier New', monospace",
        fontStyle: "bold",
        align: "center",
      }
    )
    this.titleText.setOrigin(0.5)
    this.titleText.setShadow(4, 4, "#1a1a2e", 8, true, true)

    // 副标题
    const subtitle = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.height * 0.28,
      "Chat • Collect • Play • Learn",
      {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "'Courier New', monospace",
        align: "center",
      }
    )
    subtitle.setOrigin(0.5)
    subtitle.setShadow(2, 2, "#000000", 4, true, true)
  }

  private createButtons() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY

    // 背包按钮 - 左侧，考虑按钮宽度260px + 50px间距
    this.backpackButton = this.createPixelButton(
      centerX - 185, // (260/2 + 25) = 155px 偏移
      centerY + 200, // 增加Y偏移量以增加与标题的间距（3倍）
      "Collection",
      0x4CAF50,
      () => this.openBackpack()
    )

    // 地图按钮 - 右侧，考虑按钮宽度260px + 50px间距
    this.mapButton = this.createPixelButton(
      centerX + 185, // (260/2 + 25) = 155px 偏移
      centerY + 200, // 增加Y偏移量以增加与标题的间距（3倍）
      "Explore Map",
      0x2196F3,
      () => this.openMap()
    )

    // 为按钮添加统计信息
    this.updateButtonStats()
  }

  private createPixelButton(
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y)
    
    // 按钮背景 - 多层像素效果
    const bgLarge = this.add.rectangle(0, 0, 260, 80, color, 0.9)
    const bgMedium = this.add.rectangle(0, 0, 250, 70, color, 1)
    const bgSmall = this.add.rectangle(0, 0, 240, 60, 0xffffff, 0.1)
    
    // 边框效果
    const border1 = this.add.rectangle(0, 0, 260, 80, 0x000000, 0)
    border1.setStrokeStyle(4, 0x000000)
    
    const border2 = this.add.rectangle(0, 0, 250, 70, 0x000000, 0)
    border2.setStrokeStyle(2, 0xffffff, 0.3)

    // 按钮文字
    const buttonText = this.add.text(0, 0, text, {
      fontSize: "18px",
      color: "#000000",
      fontFamily: "'Courier New', monospace",
      fontStyle: "bold",
    })
    buttonText.setOrigin(0.5)
    buttonText.setShadow(1, 1, "#ffffff", 2, true, true)

    // 组装按钮
    button.add([bgLarge, bgMedium, bgSmall, border1, border2, buttonText])
    
    // 设置交互
    button.setSize(260, 80)
    button.setInteractive({ useHandCursor: true })

    // 悬停效果
    button.on("pointerover", () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
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

    // 点击效果
    button.on("pointerdown", () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: "Power2"
      })
      
      // 延迟执行回调以显示动画
      this.time.delayedCall(200, callback)
    })

    return button
  }

  private createAnimations() {
    // 创建飘动的云朵
    for (let i = 0; i < 4; i++) {
      const cloud = this.add.image(
        Phaser.Math.Between(-100, this.cameras.main.width + 100),
        Phaser.Math.Between(50, 200),
        "cloud1"
      )
      cloud.setScale(Phaser.Math.Between(0.3, 0.6))
      cloud.setAlpha(0.6 + Math.random() * 0.3)
      
      // 云朵飘动动画
      this.tweens.add({
        targets: cloud,
        x: cloud.x + Phaser.Math.Between(200, 400),
        duration: Phaser.Math.Between(15000, 25000),
        repeat: -1,
        ease: "Linear",
        onRepeat: () => {
          cloud.x = -100
          cloud.y = Phaser.Math.Between(50, 200)
          cloud.setScale(Phaser.Math.Between(0.3, 0.6))
        }
      })
    }
  }

  private createIntroAnimation() {
    // 所有元素初始设为不可见
    this.titleText.setAlpha(0)
    this.backpackButton.setAlpha(0)
    this.mapButton.setAlpha(0)

    // 依次淡入动画
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      y: this.titleText.y + 50,
      duration: 1000,
      ease: "Back.easeOut"
    })

    this.tweens.add({
      targets: this.backpackButton,
      alpha: 1,
      x: this.backpackButton.x + 30,
      duration: 800,
      delay: 500,
      ease: "Back.easeOut"
    })

    this.tweens.add({
      targets: this.mapButton,
      alpha: 1,
      x: this.mapButton.x - 30,
      duration: 800,
      delay: 700,
      ease: "Back.easeOut"
    })
  }

  private updateButtonStats() {
    // 添加安全检查
    if (!this.gameManager || !this.gameManager.getGameState) {
      console.warn("GameManager not available in MainMenuScene")
      return
    }

    try {
      // 获取统计信息
      const gameState = this.gameManager.getGameState()
      const capturedAnimals = gameState.getCapturedAnimals()
      const totalAnimals = gameState.getAllAnimals().length

      // 在背包按钮下方添加统计信息
      const statsText = this.add.text(
        this.backpackButton.x,
        this.backpackButton.y + 60,
        `Collected: ${capturedAnimals.length}/${totalAnimals}`,
        {
          fontSize: "14px",
          color: "#ffffff",
          fontFamily: "'Courier New', monospace",
          align: "center"
        }
      )
      statsText.setOrigin(0.5)
      statsText.setShadow(1, 1, "#000000", 2, true, true)
    } catch (error) {
      console.error("Error updating button stats:", error)
    }
  }

  private openBackpack() {
    // 添加转场效果
    this.cameras.main.fadeOut(500, 0, 0, 0)
    
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("BackpackScene")
    })
  }

  private openMap() {
    // 添加转场效果
    this.cameras.main.fadeOut(500, 0, 0, 0)
    
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MapScene")
    })
  }
}
