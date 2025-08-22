import Phaser from "phaser"

export class MapScene extends Phaser.Scene {
  private northIsland?: Phaser.GameObjects.Image
  private southIsland?: Phaser.GameObjects.Image
  private gameManager: any
  private animalMarkers!: Phaser.GameObjects.Group
  private clouds!: Phaser.GameObjects.Group
  private infoPanel?: Phaser.GameObjects.Container
  private selectedRegion: "north" | "south" | null = null

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
    super({ key: "MapScene" })
  }

  preload() {
    this.load.image("north-island", "/pixelated-north-island-nz.png")
    this.load.image("south-island", "/pixelated-south-island.png")

    // Animal icons
    this.load.image("kiwi-icon", "/pixel-art-kiwi-icon.png")
    this.load.image("penguin-icon", "/pixel-art-penguin-icon.png")
    this.load.image("kakapo-icon", "/pixel-art-kakapo-icon.png")
    this.load.image("tuatara-icon", "/pixel-art-tuatara-icon.png")

    // Environment elements
    this.load.image("cloud", "/pixel-cloud.png")
    this.load.image("cloud1", "/cloud1.png")
    this.load.image("wave", "/pixel-wave.png")
    this.load.image("tree", "/pixel-tree.png")
    this.load.image("mountain", "/pixel-mountain.png")

    // UI elements
    this.load.image("info-panel", "/pixel-info-panel.png")
    this.load.image("button-bg", "/pixel-button.png")
  }

  create() {
    this.gameManager = this.registry.get("gameManager")

    this.createAnimatedBackground()

    this.animalMarkers = this.add.group()
    this.clouds = this.add.group()

    this.createEnvironmentalElements()

    // Add back to main menu button
    this.createBackButton()

    // Create enhanced islands with better interactions
    this.createEnhancedIslands()

    this.createInfoPanel()

    this.createAnimalHabitats()
  }

  private createBackButton() {
    // Create back to main menu button - mobile adaptation
    const isMobile = this.cameras.main.width < 768
    const buttonX = isMobile ? 60 : 80
    const buttonY = isMobile ? 40 : 60
    const buttonWidth = isMobile ? 100 : 120
    const buttonHeight = isMobile ? 35 : 40
    const fontSize = isMobile ? "14px" : "16px"
    
    const backButton = this.add.container(buttonX, buttonY).setDepth(20)
    
    // Button background
    const buttonBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x4caf50, 0.9)
    const buttonBorder = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0)
    buttonBorder.setStrokeStyle(2, 0x2e7d32)
    
    // Button text
    const buttonText = this.add.text(0, 0, "← Main Menu", {
      fontSize: fontSize,
      color: "#000000",
      fontStyle: "bold"
    }).setOrigin(0.5)
    
    backButton.add([buttonBg, buttonBorder, buttonText])
    
    // Set interaction - mobile increase click area
    const hitAreaWidth = isMobile ? buttonWidth + 10 : buttonWidth
    const hitAreaHeight = isMobile ? buttonHeight + 10 : buttonHeight
    backButton.setSize(hitAreaWidth, hitAreaHeight)
    backButton.setInteractive({ useHandCursor: true })
    
    // Hover effect
    backButton.on("pointerover", () => {
      this.tweens.add({
        targets: backButton,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: "Power2"
      })
      buttonBg.setFillStyle(0x66bb6a, 1)
    })
    
    backButton.on("pointerout", () => {
      this.tweens.add({
        targets: backButton,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: "Power2"
      })
      buttonBg.setFillStyle(0x4caf50, 0.9)
    })
    
    // Click event
    backButton.on("pointerdown", () => {
      // Mobile add haptic feedback
      this.safeVibrate(30)
      this.scene.start("MainMenuScene")
    })
  }

  private createAnimatedBackground() {
    const bg1 = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x87ceeb,
      )
      .setDepth(-3)
  }

  private createEnvironmentalElements() {
    for (let i = 0; i < 5; i++) {
      const cloud = this.add
        .image(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(50, 200), "cloud1")
        .setScale(0.05)
        .setAlpha(0.8)
        .setDepth(5)

      this.clouds.add(cloud)

      // Animate clouds moving across screen
      this.tweens.add({
        targets: cloud,
        x: this.cameras.main.width + 100,
        duration: Phaser.Math.Between(15000, 25000),
        repeat: -1,
        onRepeat: () => {
          cloud.x = -100
          cloud.y = Phaser.Math.Between(50, 200)
          cloud.setScale(0.05)
        },
      })
    }
  }

  private createEnhancedIslands() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY

    // 创建整个新西兰地图作为背景
    const fullMap = this.add
      .image(centerX, centerY, "north-island") // 使用其中一个作为完整地图
      .setScale(1.2)
      .setDepth(2)
      .setAlpha(0.8)

    // 创建北岛选择区域 - 调整间距为50px
    const northButton = this.add
      .rectangle(centerX - 25, centerY - 40, 160, 80, 0x4caf50, 0.7)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(3)

    const northGlow = this.add.circle(centerX - 25, centerY - 40, 85, 0x4caf50, 0.1).setDepth(2)

    northButton.on("pointerdown", () => {
      this.selectRegion("north")
    })

    northButton.on("pointerover", () => {
      this.tweens.add({
        targets: [northButton, northGlow],
        alpha: 0.9,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
      })
      this.showRegionInfo("north")
    })

    northButton.on("pointerout", () => {
      this.tweens.add({
        targets: [northButton, northGlow],
        alpha: 0.7,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      })
      this.hideRegionInfo()
    })

    // 创建南岛选择区域 - 调整间距为50px
    const southButton = this.add
      .rectangle(centerX + 25, centerY + 60, 160, 100, 0x2196f3, 0.7)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(3)

    const southGlow = this.add.circle(centerX + 25, centerY + 60, 90, 0x2196f3, 0.1).setDepth(2)

    southButton.on("pointerdown", () => {
      this.selectRegion("south")
    })

    southButton.on("pointerover", () => {
      this.tweens.add({
        targets: [southButton, southGlow],
        alpha: 0.9,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
      })
      this.showRegionInfo("south")
    })

    southButton.on("pointerout", () => {
      this.tweens.add({
        targets: [southButton, southGlow],
        alpha: 0.7,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      })
      this.hideRegionInfo()
    })

    // 添加标签 - 调整位置对应新的按钮位置
    this.add
      .text(centerX - 25, centerY - 40, "North Island", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.add
      .text(centerX + 25, centerY + 60, "South Island", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10)

    // 存储引用
    this.northIsland = northButton as any
    this.southIsland = southButton as any
  }

  private createAnimalHabitats() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY
    const isMobile = this.cameras.main.width < 768

    const habitats = [
      // 北岛动物 - 调整位置对应新的按钮位置
      { x: centerX - 45, y: centerY - 80, animal: "kiwi", region: "north" },
      { x: centerX - 5, y: centerY - 20, animal: "tuatara", region: "north" },
      // 南岛动物 - 调整位置对应新的按钮位置
      { x: centerX + 5, y: centerY + 40, animal: "kakapo", region: "south" },
      { x: centerX + 45, y: centerY + 80, animal: "penguin", region: "south" },
    ]

    habitats.forEach((habitat, index) => {
      // 添加动物栖息地的小圆圈背景 - 降低深度避免干扰
      const habitatBg = this.add
        .circle(habitat.x, habitat.y, 10, 0xffffff, 0.8)
        .setDepth(3)
        .setStrokeStyle(2, 0x333333)

      const marker = this.add
        .image(habitat.x, habitat.y, `${habitat.animal}-icon`)
        .setScale(0.05)
        .setDepth(6) // 提高深度确保在背景之上
        .setInteractive({ 
          useHandCursor: true,
          hitArea: new Phaser.Geom.Circle(0, 0, isMobile ? 30 : 20) // 移动端增加点击区域
        })
        .setAlpha(0.9)

      this.animalMarkers.add(marker)

      marker.on("pointerover", () => {
        marker.setTint(0xffff00)
        this.tweens.add({
          targets: marker,
          scaleX: isMobile ? 0.1 : 0.08,
          scaleY: isMobile ? 0.1 : 0.08,
          duration: 200,
        })
        this.showAnimalInfo(habitat.animal, habitat.x, habitat.y)
      })

      marker.on("pointerout", () => {
        marker.clearTint()
        this.tweens.add({
          targets: marker,
          scaleX: 0.05,
          scaleY: 0.05,
          duration: 200,
        })
        this.hideAnimalInfo()
      })

      marker.on("pointerdown", () => {
        // 移动端添加触觉反馈
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
        this.selectRegion(habitat.region as "north" | "south")
      })
    })
  }

  private createInfoPanel() {
    const isMobile = this.cameras.main.width < 768
    // Double the size of the panel, adjust position to stay within screen bounds
    const panelX = isMobile ? this.cameras.main.width - 160 : this.cameras.main.width - 200  // Center the larger panel
    const panelY = isMobile ? 220 : 240  // Moved down by 120px
    const panelWidth = isMobile ? 320 : 400  // 2x original size
    const panelHeight = isMobile ? 280 : 320  // 2x original size
    
    this.infoPanel = this.add
      .container(panelX, panelY)
      .setDepth(15)
      .setAlpha(0)

    const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.9)
    const panelBorder = this.add.rectangle(0, 0, panelWidth, panelHeight).setStrokeStyle(6, 0xffffff)  // Thicker border

    // Increased font sizes proportionally
    const titleSize = isMobile ? "24px" : "28px"  // 2x original size
    const contentSize = isMobile ? "20px" : "22px"  // 2x original size
    const wordWrapWidth = isMobile ? 280 : 360  // 2x original size
    
    const panelTitle = this.add
      .text(0, isMobile ? -100 : -120, "", {  // 2x original offset
        fontSize: titleSize,
        color: "#4CAF50",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const panelContent = this.add
      .text(0, 0, "", {
        fontSize: contentSize,
        color: "#ffffff",
        align: "center",
        wordWrap: { width: wordWrapWidth },
        lineSpacing: 8,  // 2x original line spacing
      })
      .setOrigin(0.5)

    this.infoPanel.add([panelBg, panelBorder, panelTitle, panelContent])
  }

  private showRegionInfo(region: "north" | "south") {
    if (!this.infoPanel) return

    const regionData = {
      north: {
        title: "North Island",
        content: "Temperate oceanic climate\nForests, grasslands and volcanoes\nHome to kiwi and tuatara\nWarm and humid, suitable for diverse life",
      },
      south: {
        title: "South Island", 
        content: "Magnificent mountains and fjords\nRich marine ecosystems\nPenguin and kakapo habitat\nCool climate, diverse terrain",
      },
    }

    const data = regionData[region]
    const children = this.infoPanel.getAll()
    
    // 正确获取子元素 - 根据添加顺序：panelBg, panelBorder, panelTitle, panelContent
    const title = children[2] as Phaser.GameObjects.Text  // panelTitle is the 3rd child (index 2)
    const content = children[3] as Phaser.GameObjects.Text  // panelContent is the 4th child (index 3)

    if (title && content) {
      title.setText(data.title)
      content.setText(data.content)

      this.tweens.add({
        targets: this.infoPanel,
        alpha: 1,
        duration: 300,
      })
    }
  }

  private hideRegionInfo() {
    if (!this.infoPanel) return

    this.tweens.add({
      targets: this.infoPanel,
      alpha: 0,
      duration: 300,
    })
  }

  private showAnimalInfo(animal: string, x: number, y: number) {
    const animalData: Record<string, string> = {
      kiwi: "Kiwi - New Zealand's national bird",
      penguin: "Yellow-eyed Penguin - Rare species",
      kakapo: "Kakapo - Flightless parrot",
      tuatara: "Tuatara - Living fossil",
    }

    const tooltip = this.add
      .text(x, y - 50, animalData[animal] || "", {
        fontSize: "12px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(20)

    // Store tooltip for cleanup
    this.data.set("currentTooltip", tooltip)
  }

  private hideAnimalInfo() {
    const tooltip = this.data.get("currentTooltip")
    if (tooltip) {
      tooltip.destroy()
      this.data.remove("currentTooltip")
    }
  }

  private selectRegion(region: "north" | "south") {
    this.selectedRegion = region

    if (this.gameManager) {
      this.gameManager.getGameState().setCurrentRegion(region)

      const regionText = region === "north" ? "North Island" : "South Island"
      const feedbackText = this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY - 150, `Selected ${regionText}!`, {
          fontSize: "24px",
          color: "#ffff00",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(20)

      this.tweens.add({
        targets: feedbackText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 500,
        yoyo: true,
        ease: "Back.easeOut",
      })

      const progressText = this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY - 120, "Preparing to enter AR mode...", {
          fontSize: "16px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 1,
        })
        .setOrigin(0.5)
        .setDepth(20)

      const overlay = this.add
        .rectangle(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          this.cameras.main.width,
          this.cameras.main.height,
          0x000000,
          0,
        )
        .setDepth(25)

      this.tweens.add({
        targets: overlay,
        alpha: 0.5,
        duration: 1500,
      })

      this.time.delayedCall(2000, () => {
        feedbackText.destroy()
        progressText.destroy()
        overlay.destroy()
        this.scene.start("ARScene", { gameManager: this.gameManager })
      })
    }
  }

  update() {
    // Update cloud positions if needed
  }
}
