import Phaser from "phaser"

export class MapScene extends Phaser.Scene {
  private northIsland?: Phaser.GameObjects.Image
  private southIsland?: Phaser.GameObjects.Image
  private gameManager: any
  private animalMarkers!: Phaser.GameObjects.Group
  private clouds!: Phaser.GameObjects.Group
  private waves!: Phaser.GameObjects.Group
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
    this.waves = this.add.group()

    this.createEnvironmentalElements()

    // Add enhanced title with pixel font styling - mobile adaptation
    const titleSize = this.cameras.main.width < 768 ? "28px" : "36px"
    const titleText = this.add
      .text(this.cameras.main.centerX, this.cameras.main.width < 768 ? 40 : 60, "New Zealand Wildlife Adventure", {
        fontSize: titleSize,
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10)

    // Add back to main menu button
    this.createBackButton()

    this.tweens.add({
      targets: titleText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })

    // Create enhanced islands with better interactions
    this.createEnhancedIslands()

    this.createInfoPanel()

    this.createAnimalHabitats()

    // Add enhanced instructions - mobile adaptation
    const instructionSize = this.cameras.main.width < 768 ? "16px" : "20px"
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.height - (this.cameras.main.width < 768 ? 60 : 80), "Select an island to begin your New Zealand wildlife adventure", {
        fontSize: instructionSize,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10)
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
        .image(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(50, 200), "cloud")
        .setScale(0.1)
        .setAlpha(0.7)
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
        },
      })
    }

    for (let i = 0; i < 8; i++) {
      const wave = this.add
        .image(
          Phaser.Math.Between(0, this.cameras.main.width),
          this.cameras.main.centerY + Phaser.Math.Between(100, 200),
          "wave",
        )
        .setScale(0.05)
        .setAlpha(0.5)
        .setDepth(1)

      this.waves.add(wave)

      // 水波左右来回移动
      this.tweens.add({
        targets: wave,
        x: wave.x + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
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

    // 创建北岛选择区域
    const northButton = this.add
      .rectangle(centerX - 80, centerY - 40, 160, 80, 0x4caf50, 0.7)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(3)

    const northGlow = this.add.circle(centerX - 80, centerY - 40, 85, 0x4caf50, 0.1).setDepth(2)

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

    // 创建南岛选择区域
    const southButton = this.add
      .rectangle(centerX + 80, centerY + 60, 160, 100, 0x2196f3, 0.7)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setDepth(3)

    const southGlow = this.add.circle(centerX + 80, centerY + 60, 90, 0x2196f3, 0.1).setDepth(2)

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

    // 添加标签
    this.add
      .text(centerX - 80, centerY - 40, "North Island", {
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
      .text(centerX + 80, centerY + 60, "South Island", {
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
      // 北岛动物 - 重新定位避免重叠
      { x: centerX - 100, y: centerY - 80, animal: "kiwi", region: "north" },
      { x: centerX - 60, y: centerY - 20, animal: "tuatara", region: "north" },
      // 南岛动物 - 重新定位避免重叠
      { x: centerX + 60, y: centerY + 40, animal: "kakapo", region: "south" },
      { x: centerX + 100, y: centerY + 80, animal: "penguin", region: "south" },
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
    const panelX = isMobile ? this.cameras.main.width - 180 : this.cameras.main.width - 220
    const panelY = isMobile ? 100 : 120
    const panelWidth = isMobile ? 160 : 200
    const panelHeight = isMobile ? 140 : 160
    
    this.infoPanel = this.add
      .container(panelX, panelY)
      .setDepth(15)
      .setAlpha(0)

    const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.9)
    const panelBorder = this.add.rectangle(0, 0, panelWidth, panelHeight).setStrokeStyle(3, 0xffffff)

    const titleSize = isMobile ? "12px" : "14px"
    const contentSize = isMobile ? "10px" : "11px"
    const wordWrapWidth = isMobile ? 140 : 180
    
    const panelTitle = this.add
      .text(0, isMobile ? -50 : -60, "", {
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
        lineSpacing: 4,
      })
      .setOrigin(0.5)

    this.infoPanel.add([panelBg, panelBorder, panelTitle, panelContent])
  }

  private showRegionInfo(region: "north" | "south") {
    if (!this.infoPanel) return

    const regionData = {
      north: {
        title: "North Island",
        content: "🌿 Temperate oceanic climate\n🏞️ Forests, grasslands and volcanoes\n🐦 Home to kiwi and tuatara\n🌡️ Warm and humid, suitable for diverse life",
      },
      south: {
        title: "South Island",
        content: "🏔️ Magnificent mountains and fjords\n🌊 Rich marine ecosystems\n🐧 Penguin and kakapo habitat\n❄️ Cool climate, diverse terrain",
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
        this.scene.start("ARScene")
      })
    }
  }

  update() {
    // Update wave positions and animations
    this.waves.children.entries.forEach((wave: any) => {
      if (wave.x > this.cameras.main.width + 50) {
        wave.x = -50
      }
    })
  }
}
