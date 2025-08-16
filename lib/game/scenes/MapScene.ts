import Phaser from "phaser"

export class MapScene extends Phaser.Scene {
  private northIsland?: Phaser.GameObjects.Image
  private southIsland?: Phaser.GameObjects.Image
  private gameManager: any
  private animalMarkers: Phaser.GameObjects.Group
  private clouds: Phaser.GameObjects.Group
  private waves: Phaser.GameObjects.Group
  private infoPanel?: Phaser.GameObjects.Container
  private selectedRegion: "north" | "south" | null = null

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
    this.gameManager = this.game.gameManager

    this.createAnimatedBackground()

    this.animalMarkers = this.add.group()
    this.clouds = this.add.group()
    this.waves = this.add.group()

    this.createEnvironmentalElements()

    // Add enhanced title with pixel font styling
    const titleText = this.add
      .text(this.cameras.main.centerX, 60, "新西兰动物探险", {
        fontSize: "36px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10)

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

    this.createLegend()

    // Add enhanced instructions
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.height - 80, "点击岛屿探索动物栖息地", {
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10)
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

    const bg2 = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 200,
        this.cameras.main.width,
        this.cameras.main.height / 2,
        0x4682b4,
      )
      .setDepth(-2)
      .setAlpha(0.3)

    this.tweens.add({
      targets: bg2,
      alpha: 0.6,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })
  }

  private createEnvironmentalElements() {
    for (let i = 0; i < 5; i++) {
      const cloud = this.add
        .image(Phaser.Math.Between(0, this.cameras.main.width), Phaser.Math.Between(50, 200), "cloud")
        .setScale(0.5)
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
        .setScale(0.3)
        .setAlpha(0.5)
        .setDepth(1)

      this.waves.add(wave)

      this.tweens.add({
        targets: wave,
        scaleX: 0.4,
        scaleY: 0.4,
        alpha: 0.8,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    }
  }

  private createEnhancedIslands() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY

    this.northIsland = this.add
      .image(centerX - 120, centerY - 60, "north-island")
      .setInteractive({ useHandCursor: true })
      .setScale(0.9)
      .setDepth(3)

    const northGlow = this.add.circle(centerX - 120, centerY - 60, 80, 0xffffff, 0.1).setDepth(2)

    this.northIsland.on("pointerdown", () => {
      this.selectRegion("north")
    })

    this.northIsland.on("pointerover", () => {
      this.northIsland?.setTint(0xdddddd)
      this.tweens.add({
        targets: northGlow,
        alpha: 0.3,
        duration: 300,
      })
      this.showRegionInfo("north")
    })

    this.northIsland.on("pointerout", () => {
      this.northIsland?.clearTint()
      this.tweens.add({
        targets: northGlow,
        alpha: 0.1,
        duration: 300,
      })
      this.hideRegionInfo()
    })

    this.southIsland = this.add
      .image(centerX + 120, centerY + 60, "south-island")
      .setInteractive({ useHandCursor: true })
      .setScale(0.9)
      .setDepth(3)

    const southGlow = this.add.circle(centerX + 120, centerY + 60, 80, 0xffffff, 0.1).setDepth(2)

    this.southIsland.on("pointerdown", () => {
      this.selectRegion("south")
    })

    this.southIsland.on("pointerover", () => {
      this.southIsland?.setTint(0xdddddd)
      this.tweens.add({
        targets: southGlow,
        alpha: 0.3,
        duration: 300,
      })
      this.showRegionInfo("south")
    })

    this.southIsland.on("pointerout", () => {
      this.southIsland?.clearTint()
      this.tweens.add({
        targets: southGlow,
        alpha: 0.1,
        duration: 300,
      })
      this.hideRegionInfo()
    })

    this.add
      .text(centerX - 120, centerY + 40, "北岛", {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10)

    this.add
      .text(centerX + 120, centerY + 160, "南岛", {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10)
  }

  private createAnimalHabitats() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY

    const habitats = [
      { x: centerX - 150, y: centerY - 90, animal: "kiwi", region: "north" },
      { x: centerX - 90, y: centerY - 30, animal: "tuatara", region: "north" },
      { x: centerX + 90, y: centerY + 30, animal: "kakapo", region: "south" },
      { x: centerX + 150, y: centerY + 90, animal: "penguin", region: "south" },
    ]

    habitats.forEach((habitat, index) => {
      const marker = this.add
        .image(habitat.x, habitat.y, `${habitat.animal}-icon`)
        .setScale(0.4)
        .setDepth(4)
        .setInteractive({ useHandCursor: true })

      this.animalMarkers.add(marker)

      this.tweens.add({
        targets: marker,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: index * 500,
      })

      marker.on("pointerover", () => {
        marker.setTint(0xffff00)
        this.showAnimalInfo(habitat.animal, habitat.x, habitat.y)
      })

      marker.on("pointerout", () => {
        marker.clearTint()
        this.hideAnimalInfo()
      })

      marker.on("pointerdown", () => {
        this.selectRegion(habitat.region)
      })
    })
  }

  private createInfoPanel() {
    this.infoPanel = this.add
      .container(this.cameras.main.width - 200, 100)
      .setDepth(15)
      .setAlpha(0)

    const panelBg = this.add.rectangle(0, 0, 180, 120, 0x000000, 0.8).setStroke(0xffffff, 2)

    const panelTitle = this.add
      .text(0, -40, "", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const panelContent = this.add
      .text(0, 0, "", {
        fontSize: "12px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 160 },
      })
      .setOrigin(0.5)

    this.infoPanel.add([panelBg, panelTitle, panelContent])
  }

  private createLegend() {
    const legendContainer = this.add.container(50, this.cameras.main.height - 150).setDepth(10)

    const legendBg = this.add.rectangle(0, 0, 160, 100, 0x000000, 0.7).setStroke(0xffffff, 1)

    const legendTitle = this.add
      .text(0, -35, "图例", {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const legendItems = [
      { icon: "kiwi-icon", text: "几维鸟", y: -15 },
      { icon: "penguin-icon", text: "企鹅", y: 0 },
      { icon: "kakapo-icon", text: "鸮鹦鹉", y: 15 },
      { icon: "tuatara-icon", text: "楔齿蜥", y: 30 },
    ]

    legendItems.forEach((item) => {
      const icon = this.add.image(-60, item.y, item.icon).setScale(0.2)
      const text = this.add
        .text(-40, item.y, item.text, {
          fontSize: "10px",
          color: "#ffffff",
        })
        .setOrigin(0, 0.5)

      legendContainer.add([icon, text])
    })

    legendContainer.add([legendBg, legendTitle])
  }

  private showRegionInfo(region: "north" | "south") {
    if (!this.infoPanel) return

    const regionData = {
      north: {
        title: "北岛",
        content: "温带气候\n森林和草原\n几维鸟和楔齿蜥的家园",
      },
      south: {
        title: "南岛",
        content: "多样化地形\n山脉和海岸\n鸮鹦鹉和企鹅栖息地",
      },
    }

    const data = regionData[region]
    const title = this.infoPanel.list[1] as Phaser.GameObjects.Text
    const content = this.infoPanel.list[2] as Phaser.GameObjects.Text

    title.setText(data.title)
    content.setText(data.content)

    this.tweens.add({
      targets: this.infoPanel,
      alpha: 1,
      duration: 300,
    })
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
      kiwi: "几维鸟 - 新西兰国鸟",
      penguin: "黄眼企鹅 - 稀有物种",
      kakapo: "鸮鹦鹉 - 不会飞的鹦鹉",
      tuatara: "楔齿蜥 - 活化石",
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
    console.log(`Selected region: ${region}`)
    this.selectedRegion = region

    if (this.gameManager) {
      this.gameManager.getGameState().setCurrentRegion(region)

      const regionText = region === "north" ? "北岛" : "南岛"
      const feedbackText = this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY - 150, `已选择${regionText}！`, {
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
        .text(this.cameras.main.centerX, this.cameras.main.centerY - 120, "准备进入AR模式...", {
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
