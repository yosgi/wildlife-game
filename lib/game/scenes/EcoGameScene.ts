import Phaser from "phaser"
import type { Animal } from "../GameState"

interface EcoGameData {
  animal: Animal
  gameManager: any
}

export class EcoGameScene extends Phaser.Scene {
  private gameManager: any
  private animal!: Animal
  private kakapo!: Phaser.GameObjects.Sprite
  private isDragging = false
  private lastPointerX = 0
  private lastPointerY = 0
  private isInitialized = false
  private hasSpawnedAnimals = false  // Flag to spawn animals only once
  
  // Game state
  private birdPopulation = 50
  private environmentScore = 75
  private trees = 10
  private predators = 3
  
  // DOM elements
  private gameUI!: HTMLDivElement
  private scorePanel!: HTMLDivElement
  
  // Phaser objects that need cleanup
  private waveTweens: Phaser.Tweens.Tween[] = []
  private birdTweens: Phaser.Tweens.Tween[] = []
  
  constructor() {
    super({ key: "EcoGameScene" })
  }

  preload() {
    // Load forest tileset
    this.load.image("forest", "/forest.png")
    // Load cloud tileset
    this.load.image("cloud1", "/cloud1.png")
    
    // Load individual sprite assets for ecosystems
    this.load.image("pixel-tree", "/pixel-tree.png")
    this.load.image("food-flowers", "/food-flowers.png")
    this.load.image("food-fish", "/food-fish.png")
    
    // Load trees from public/trees directory
    this.load.image("tree-1", "/trees/row-4-column-4.png")
    this.load.image("tree-2", "/trees/row-4-column-5.png")
    this.load.image("tree-3", "/trees/row-4-column-6.png")
    
    // Load sheep from NZ wilds directory
    this.load.image("sheep", "/NZ wilds/sheep.png")
    
    // Load landscape elements
    this.load.image("pixel-mountain", "/pixel-mountain.png")
    this.load.image("stone", "/stone.png")
    
    this.load.image("kiwi-icon", "/pixel-art-kiwi-icon.png")
    this.load.image("penguin-icon", "/pixel-art-penguin-icon.png")
    this.load.image("kakapo-icon", "/pixel-art-kakapo-icon.png")
    this.load.image("tuatara-icon", "/pixel-art-tuatara-icon.png")
    
    // Load other environment assets
    this.load.image("cloud", "/pixel-cloud.png")
    this.load.image("wave", "/pixel-wave.png")
  }

  init() {
    // Clean up any leftover elements when scene initializes
    const existingUI = document.querySelector('.eco-game-ui')
    if (existingUI) {
      existingUI.remove()
    }
    const existingScore = document.querySelector('.eco-game-score')
    if (existingScore) {
      existingScore.remove()
    }
  }

  wake() {
    // Show game UI when scene wakes up
    if (this.gameUI) {
      this.gameUI.style.display = 'flex'
    }
    if (this.scorePanel) {
      this.scorePanel.style.display = 'block'
    }
  }

  create() {
    if (this.isInitialized) {
      console.log('EcoGameScene already initialized, skipping...')
      return
    }
    
    console.log('=== EcoGameScene create() called ===')
    
    // Force this scene to be visible and active
    this.scene.setVisible(true)
    this.scene.setActive(true)
    
    // Get data from previous scene
    const data = this.sys.settings.data as EcoGameData
    this.gameManager = data?.gameManager || this.registry.get("gameManager")
    this.animal = data?.animal
    
    console.log('EcoGame started with animal:', this.animal?.name)
    console.log('GameManager:', this.gameManager ? 'Found' : 'Missing')
    
    try {
      this.createBackground()
      this.createIslands()
      this.createKakapo()
      this.createGameUI()
      this.createScorePanel()
      this.setupDragControls()
      
      this.isInitialized = true
      console.log('=== EcoGameScene initialization complete ===')
      
      // Add a title to make sure the scene is visible
      this.add.text(this.scale.width / 2, 50, 'Save the Kakapo!', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(100)
      
      // Force render update
      this.sys.queueDepthSort()
      
    } catch (error) {
      console.error('Error during EcoGameScene creation:', error)
    }
  }

  private createBackground() {
    // Clear any existing background
    this.cameras.main.setBackgroundColor(0x4A90E2)
    
    // Ocean background - make sure it covers the entire screen
    const bg = this.add.rectangle(
      0, 0,
      this.scale.width,
      this.scale.height,
      0x4A90E2
    ).setOrigin(0, 0).setDepth(-10)
    
    // Add some wave effects
    for (let i = 0; i < 5; i++) {
      const wave = this.add.ellipse(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(this.scale.height * 0.6, this.scale.height),
        Phaser.Math.Between(50, 100),
        20,
        0x5BA3F5,
        0.3
      ).setDepth(-5)
      
      const waveTween = this.tweens.add({
        targets: wave,
        scaleX: 1.2,
        scaleY: 1.5,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      // Store reference for cleanup
      this.waveTweens.push(waveTween)
    }
    
    // Add clouds in the sky using cloud1.png tileset
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.image(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(50, 200),
        "cloud1"
      ).setScale(0.05)
       .setDepth(-3)
       .setAlpha(0.8)
      
      const cloudTween = this.tweens.add({
        targets: cloud,
        x: this.scale.width + 100,
        duration: Phaser.Math.Between(20000, 30000),
        repeat: -1,
        onRepeat: () => {
          cloud.x = -100
          cloud.y = Phaser.Math.Between(50, 200)
          cloud.setScale(0.05)
        }
      })
      
      this.waveTweens.push(cloudTween) // Reuse waveTweens array for all background tweens
    }
    
    // Add penguins in the ocean - their natural habitat (NOT on land islands)
    for (let i = 0; i < 3; i++) {
      const penguin = this.add.image(
        Phaser.Math.Between(100, this.scale.width - 100),
        Phaser.Math.Between(this.scale.height * 0.4, this.scale.height * 0.8),
        "penguin-icon"
      ).setScale(0.05)
       .setOrigin(0.5)
       .setDepth(2)
       .setAlpha(0.9)
      
      // Add swimming animation for penguins
      const penguinTween = this.tweens.add({
        targets: penguin,
        x: penguin.x + Phaser.Math.Between(-30, 30),
        y: penguin.y + Phaser.Math.Between(-15, 15),
        duration: Phaser.Math.Between(2000, 3500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000)
      })
      
      this.waveTweens.push(penguinTween)
    }
    
    // Add fish food scattered in the ocean
    for (let i = 0; i < 5; i++) {
      const fishFood = this.add.image(
        Phaser.Math.Between(50, this.scale.width - 50),
        Phaser.Math.Between(this.scale.height * 0.5, this.scale.height * 0.9),
        "food-fish"
      ).setScale(0.027)  // Reduced from 0.08 to ~0.027 (3 times smaller)
       .setOrigin(0.5)
       .setDepth(1)
       .setAlpha(0.8)
      
      // Add floating animation for fish food
      const fishTween = this.tweens.add({
        targets: fishFood,
        y: fishFood.y - Phaser.Math.Between(8, 15),
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 800)
      })
      
      this.waveTweens.push(fishTween)
    }
  }


  private createIslands() {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    
    // Grassland Island - boundary around the actual grass elements and animals
    const grasslandIslandPoints = [
      -270, -170,  // Top left (around leftmost grass)
      -90, -180,   // Top center left  
      70, -150,    // Top center (around topmost grass)
      200, -130,   // Top right
      240, -70,    // Right top (around rightmost grass)
      230, 10,     // Right center
      210, 90,     // Right bottom
      120, 150,    // Bottom right (around bottommost grass)
      -40, 160,    // Bottom center
      -160, 130,   // Bottom left
      -270, 90,    // Left bottom (around leftmost bottom grass)
      -280, 10,    // Left center
      -270, -80,   // Left top
      -280, -130   // Left top corner
    ]
    
    const grasslandIsland = this.add.polygon(
      centerX - 80, centerY+210,
      grasslandIslandPoints,
      0x9ACD32  // Grass green color
    ).setDepth(1)
    
    // Add outline to grassland island for better definition
    const grasslandOutline = this.add.polygon(
        centerX - 80, centerY+210,
      grasslandIslandPoints
    ).setStrokeStyle(4, 0x7BB526, 0.8).setDepth(1)
    
    // Pure grassland without visible grass clumps
    
    // No trees in grassland - keeping it as pure grassland habitat
    
    // Place single grazing animal within the grassland boundary - only kiwi suitable for grassland
    const singleKiwi = this.add.image(
      centerX - 300 + 60, centerY + 80, // Position from the original grazingPositions
      'kiwi-icon'  // Only kiwi in grassland - penguins belong in ocean
    ).setScale(0.06)
     .setOrigin(0.5)
     .setDepth(4)
     .setAlpha(0.9)
    
    // Add sheep to grassland
    const sheep = this.add.image(
      centerX - 400, centerY + 140, // Position near kiwi but offset
      'sheep'
    ).setScale(1.1)  // Slightly larger than kiwi
     .setOrigin(0.5)
     .setDepth(4)
     .setAlpha(0.9)
    
    console.log('✅ Sheep added to grassland at:', sheep.x, sheep.y)
    
    // Add mountain to grassland background
    const mountain = this.add.image(
      centerX - 500, centerY - 100, // Left side of grassland, in background
      'pixel-mountain'
    ).setScale(0.1)  // Medium size for background element
     .setOrigin(0.5)
     .setDepth(2)    // Behind animals but above island
     .setAlpha(0.8)  // Slightly transparent
    
    // Add stone to grassland
    const stone = this.add.image(
      centerX - 550, centerY + 70, // Right side of grassland
      'stone'
    ).setScale(0.9)  // Small decorative element
     .setOrigin(0.5)
     .setDepth(3)    // Above background, below animals
     .setAlpha(0.9)
    
    console.log('✅ Mountain and stone added to grassland')
    
    // Safe Island (right) - forest sanctuary moved further right and smaller
    const forestIslandPoints = [
      -240, -160,  // Top left
      -120, -180,  // Top center left
      10, -160,    // Top center
      140, -150,   // Top center right
      240, -130,   // Top right
      260, -70,    // Right top
      240, 20,     // Right center
      220, 120,    // Right center bottom
      180, 160,    // Right bottom
      100, 170,    // Bottom right
      -20, 160,    // Bottom center
      -140, 150,   // Bottom left
      -240, 90,    // Left bottom
      -260, -10,   // Left center
      -240, -80,   // Left top
      -250, -120   // Left top corner
    ]
    
    const safeIsland = this.add.polygon(
      centerX + 750, centerY + 270,  // Moved right +300px, down +270px
      forestIslandPoints,
      0x228B22
    ).setDepth(1)
    
    // Add outline to forest island for better definition
    const forestOutline = this.add.polygon(
      centerX + 750, centerY + 270,  // Moved right +300px, down +270px
      forestIslandPoints
    ).setStrokeStyle(4, 0x1E5F1E, 0.8).setDepth(1)
    
    // Open forest sanctuary - no animals, clean environment
    
    // Add three trees in the forest using public/trees assets
    const treePositions = [
      { x: -150, y: -120, type: 'tree-1' },   // North west area (更分散)
      { x: 0, y: -50, type: 'tree-2' },       // North central area  
      { x: 150, y: 80, type: 'tree-3' }       // South east area (更分散)
    ]
    
    treePositions.forEach(treePos => {
      // First check if the texture is loaded
      if (this.textures.exists(treePos.type)) {
        const tree = this.add.image(
          centerX + 450 + treePos.x, centerY + 170 + treePos.y,
          treePos.type
        ).setScale(1.5)  // 5倍放大: 0.3 × 5 = 1.5 (150%的原始大小)
         .setOrigin(0.5)
         .setDepth(10)   // Higher depth to be above everything except UI
         .setAlpha(1.0)  // Full opacity
        console.log(`✅ Tree ${treePos.type} added successfully at:`, tree.x, tree.y)
        console.log(`Tree properties: scale=${tree.scale}, depth=${tree.depth}, alpha=${tree.alpha}, visible=${tree.visible}`)
        
        // Force the tree to be visible and active
        tree.setVisible(true)
        tree.setActive(true)
        
      } else {
        console.error(`❌ Texture ${treePos.type} not found! Available textures:`, Object.keys(this.textures.list))
        
        // Fallback: create a colored rectangle as placeholder
        const placeholder = this.add.rectangle(
          centerX + 750 + treePos.x, centerY + 270 + treePos.y,
          50, 60, 0xff0000  // Red color to be obvious
        ).setDepth(10)
        
        console.log(`🔶 Created placeholder for ${treePos.type} at:`, placeholder.x, placeholder.y)
      }
    })
    
    // No flowering plants - clean forest environment
    
    // Add two kiwi birds in the forest sanctuary
    const forestKiwiPositions = [
      { x: -100, y: 0 },   // Left side of forest
      { x: 80, y: -80 }    // Right side of forest, slightly north
    ]
    
    forestKiwiPositions.forEach((pos, index) => {
      const forestKiwi = this.add.image(
        centerX + 550 + pos.x, centerY + 170 + pos.y,
        'kiwi-icon'
      ).setScale(0.06)  // Same size as grassland kiwi
       .setOrigin(0.5)
       .setDepth(5)     // Above trees and background, below UI
       .setAlpha(0.9)
      
      console.log(`✅ Forest Kiwi ${index + 1} added at:`, forestKiwi.x, forestKiwi.y)
    })
    
    // Add two tuatara lizards in the forest sanctuary
    const forestTuataraPositions = [
      { x: -200, y: -150 },   // Center-left of forest, moved left 150px and up 200px
      { x: -30, y: -180 }     // Right side of forest, moved left 150px and up 200px
    ]
    
    forestTuataraPositions.forEach((pos, index) => {
      const forestTuatara = this.add.image(
        centerX + 750 + pos.x, centerY + 270 + pos.y,
        'tuatara-icon'
      ).setScale(0.07)  // Slightly larger than kiwi
       .setOrigin(0.5)
       .setDepth(5)     // Same depth as kiwi birds
       .setAlpha(0.9)
      
      console.log(`✅ Forest Tuatara ${index + 1} added at:`, forestTuatara.x, forestTuatara.y)
    })
    
    // Forest now has kiwi birds and tuatara lizards as native inhabitants
    // (All penguins belong in ocean only)
    
    // Island labels with updated names
    this.add.text(centerX - 300, centerY + 220, 'GRASSLAND', {
      fontSize: '18px',
      color: '#32CD32',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6)
    
    this.add.text(centerX + 600, centerY + 370, 'FOREST', {  // Moved left 150px (-150) and up 100px (-100)
      fontSize: '18px', 
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6)
  }

  private createKakapo() {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    
    // Create kakapo on grassland island (starts in a safer but not ideal environment)
    this.kakapo = this.add.sprite(centerX - 300, centerY, '')
      .setDepth(10)
      .setInteractive({ 
        draggable: true,
        hitArea: new Phaser.Geom.Circle(0, 0, 25),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true
      })
    
    // Create kakapo as a colored circle with better styling
    const kakapoGraphics = this.add.graphics()
    kakapoGraphics.fillStyle(0x4a5d23, 0.9)
    kakapoGraphics.fillCircle(0, 0, 18)
    kakapoGraphics.lineStyle(3, 0x2d3a14)
    kakapoGraphics.strokeCircle(0, 0, 18)
    kakapoGraphics.generateTexture('kakapo-sprite', 40, 40)
    kakapoGraphics.destroy()
    
    this.kakapo.setTexture('kakapo-sprite')
    
    // Add kakapo icon on top instead of emoji
    const kakapoIcon = this.add.image(centerX - 300, centerY, 'kakapo-icon')
      .setScale(0.08)
      .setOrigin(0.5)
      .setDepth(11)
    
    // Add glow effect for when dragging
    const glowEffect = this.add.circle(centerX - 300, centerY, 25, 0xffff00, 0)
      .setDepth(9)
    
    // Store references
    this.kakapo.setData('icon', kakapoIcon)
    this.kakapo.setData('glow', glowEffect)
  }

  private createGameUI() {
    // Clean up any existing UI first
    const existingUI = document.querySelector('.eco-game-ui')
    if (existingUI) {
      existingUI.remove()
    }
    
    this.gameUI = document.createElement('div')
    this.gameUI.className = 'eco-game-ui'
    this.gameUI.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      z-index: 1000;
      font-family: 'Courier New', monospace;
    `
    
    // Action buttons
    const buttons = [
      { text: ' Plant Tree', action: 'plant', cost: 'Env -5, Birds +10' },
      { text: ' Cut Tree', action: 'cut', cost: 'Env +5, Birds -15' },
      { text: ' Feed Birds', action: 'feed', cost: 'Birds +5' }
    ]
    
    buttons.forEach(btn => {
      const button = document.createElement('button')
      button.innerHTML = btn.text
      button.title = btn.cost
      button.style.cssText = `
        padding: 12px 16px;
        background: #4CAF50;
        border: 2px solid #2E7D32;
        border-radius: 8px;
        color: white;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      `
      
      button.addEventListener('mouseenter', () => {
        button.style.background = '#45a049'
        button.style.transform = 'translateY(-2px)'
      })
      
      button.addEventListener('mouseleave', () => {
        button.style.background = '#4CAF50'
        button.style.transform = 'translateY(0)'
      })
      
      button.addEventListener('click', () => {
        this.handleAction(btn.action)
      })
      
      this.gameUI.appendChild(button)
    })
    
    // Back button
    const backButton = document.createElement('button')
    backButton.innerHTML = '← Back'
    backButton.style.cssText = `
      padding: 12px 16px;
      background: #ff4444;
      border: 2px solid #cc0000;
      border-radius: 8px;
      color: white;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
    `
    
    backButton.addEventListener('click', () => {
      this.exitGame()
    })
    
    this.gameUI.appendChild(backButton)
    document.body.appendChild(this.gameUI)
  }

  private createScorePanel() {
    // Clean up any existing score panel first
    const existingPanel = document.querySelector('.eco-game-score')
    if (existingPanel) {
      existingPanel.remove()
    }
    
    this.scorePanel = document.createElement('div')
    this.scorePanel.className = 'eco-game-score'
    this.scorePanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 1000;
      min-width: 200px;
    `
    
    this.updateScoreDisplay()
    document.body.appendChild(this.scorePanel)
  }

  private updateScoreDisplay() {
    if (!this.scorePanel) return
    
    const kakapoStatus = this.isKakapoSafe() ? '🟢 Safe' : '🔴 In Danger'
    
    this.scorePanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #4CAF50;">
        ${this.animal?.name || 'Save the Kakapo'}
      </div>
      <div style="margin-bottom: 5px;">
         Bird Population: ${this.birdPopulation}
      </div>
      <div style="margin-bottom: 5px;">
         Environment: ${this.environmentScore}
      </div>
      <div style="margin-bottom: 5px;">
         Trees: ${this.trees}
      </div>
      <div style="margin-bottom: 5px;">
         Predators: ${this.predators}
      </div>
      <div style="margin-top: 10px; font-weight: bold;">
        Status: ${kakapoStatus}
      </div>
    `
  }

  private setupDragControls() {
    this.input.setDraggable(this.kakapo)
    
    this.input.on('dragstart', (pointer: any, gameObject: any) => {
      this.isDragging = true
      gameObject.setTint(0xffff00) // Highlight when dragging
      
      // Show glow effect
      const glow = gameObject.getData('glow')
      if (glow) {
        glow.setAlpha(0.3)
        this.tweens.add({
          targets: glow,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          ease: 'Power2'
        })
      }
    })
    
    this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
      gameObject.x = dragX
      gameObject.y = dragY
      
      // Update icon position
      const icon = gameObject.getData('icon')
      if (icon) {
        icon.x = dragX
        icon.y = dragY
      }
      
      // Update glow position
      const glow = gameObject.getData('glow')
      if (glow) {
        glow.x = dragX
        glow.y = dragY
      }
    })
    
    this.input.on('dragend', (pointer: any, gameObject: any) => {
      this.isDragging = false
      gameObject.clearTint()
      
      // Hide glow effect
      const glow = gameObject.getData('glow')
      if (glow) {
        this.tweens.add({
          targets: glow,
          alpha: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 300,
          ease: 'Power2'
        })
      }
      
      // Check if kakapo reached safety
      this.checkKakapoSafety()
      this.updateScoreDisplay()
    })
  }

  private isKakapoSafe(): boolean {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    
    // Forest island center (moved left 200px for kakapo safety zone)
    const forestCenterX = centerX + 750 - 200  // Moved left 200px
    const forestCenterY = centerY + 170
    
    // Use approximate bounding box for the irregular forest island
    // Based on the polygon points, create a safe zone
    const kakapoX = this.kakapo.x
    const kakapoY = this.kakapo.y
    
    // Define safe zone boundaries based on the actual forest polygon
    // Using the same coordinate system as the forest island creation
    const leftBound = forestCenterX - 240   // -240 from polygon points (leftmost point)
    const rightBound = forestCenterX + 260  // +260 from polygon points (rightmost point)
    const topBound = forestCenterY - 180    // -180 from polygon points (topmost point)
    const bottomBound = forestCenterY + 170 // +170 from polygon points (bottommost point)
    
    console.log(`🔍 Kakapo position: (${kakapoX}, ${kakapoY})`)
    console.log(`🔍 Forest boundaries: Left=${leftBound}, Right=${rightBound}, Top=${topBound}, Bottom=${bottomBound}`)
    
    // Check if kakapo is within the forest island boundaries
    const isSafe = kakapoX >= leftBound && kakapoX <= rightBound && 
                   kakapoY >= topBound && kakapoY <= bottomBound
    
    console.log(`🔍 Kakapo is ${isSafe ? 'SAFE' : 'NOT SAFE'} in forest`)
    
    return isSafe
  }

  private checkKakapoSafety() {
    const isSafe = this.isKakapoSafe()
    
    if (isSafe) {
      this.showFeedback('🟢 Kakapo is safe! Birds +2, Environment +1', '#4CAF50')
      this.birdPopulation = Math.min(100, this.birdPopulation + 2)
      this.environmentScore = Math.min(100, this.environmentScore + 1)
      
      // Spawn 2 more kakapo animals in forest when reaching safe zone (only once)
      if (!this.hasSpawnedAnimals) {
        this.spawnForestKakapos()
        this.hasSpawnedAnimals = true
        this.showFeedback('🎉 Two more kakapos appeared in the forest!', '#FFD700')
      }
    } else {
      this.showFeedback('🔴 Kakapo is in danger! Birds -3', '#ff4444')
      this.birdPopulation = Math.max(0, this.birdPopulation - 3)
    }
  }

  private spawnForestKakapos() {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    
    // Forest island center
    const forestCenterX = centerX + 750
    const forestCenterY = centerY + 170
    
    // Define positions for 2 new kakapos in forest, avoiding existing animals and trees
    const kakapoPositions = [
      { x: -50 - 310, y:0 },   // South area of forest, moved left 230px and up 170px
      { x: 120 - 330, y: -120  }   // North-east area of forest, moved left 230px and up 170px
    ]
    
    kakapoPositions.forEach((pos, index) => {
      // Create kakapo sprite
      const newKakapo = this.add.image(
        forestCenterX + pos.x, forestCenterY + pos.y,
        'kakapo-icon'
      ).setScale(0.08)  // Same size as main kakapo
       .setOrigin(0.5)
       .setDepth(6)     // Above trees and other animals
       .setAlpha(0)     // Start invisible
       .setTint(0x90EE90)  // Light green tint to distinguish from player kakapo
      
      // Add 1-second delayed fade-in animation
      this.tweens.add({
        targets: newKakapo,
        alpha: 0.9,
        duration: 1000,
        ease: 'Power2.easeOut',
        delay: index * 200  // Stagger the appearance by 200ms for each kakapo
      })
      
      // Add gentle animation to make them feel alive (starts after fade-in)
      this.tweens.add({
        targets: newKakapo,
        y: newKakapo.y + Phaser.Math.Between(-10, 10),
        duration: Phaser.Math.Between(2000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 1000 + Phaser.Math.Between(0, 1000)  // Start after fade-in completes
      })
      
      console.log(`✅ Spawned Kakapo ${index + 1} at:`, newKakapo.x, newKakapo.y)
    })
    
    console.log('🎉 Two new kakapos spawned in forest sanctuary!')
  }

  private handleAction(action: string) {
    switch (action) {
      case 'plant':
        if (this.environmentScore >= 5) {
          this.trees++
          this.environmentScore -= 5
          this.birdPopulation = Math.min(100, this.birdPopulation + 10)
          this.showFeedback(' Tree planted! Birds love it!', '#4CAF50')
          this.refreshIslands()
        } else {
          this.showFeedback('❌ Not enough environmental resources!', '#ff4444')
        }
        break
        
      case 'cut':
        if (this.trees > 0) {
          this.trees--
          this.environmentScore = Math.min(100, this.environmentScore + 5)
          this.birdPopulation = Math.max(0, this.birdPopulation - 15)
          this.showFeedback(' Tree cut! Birds lost habitat!', '#ff8800')
          this.refreshIslands()
        } else {
          this.showFeedback('❌ No trees to cut!', '#ff4444')
        }
        break
        
      case 'feed':
        this.birdPopulation = Math.min(100, this.birdPopulation + 5)
        this.showFeedback(' Birds fed! Population increased!', '#4CAF50')
        break
    }
    
    this.updateScoreDisplay()
    this.checkWinCondition()
  }

  private refreshIslands() {
    // Instead of restarting the entire scene, just update the display
    // Scene restart can cause tween conflicts
    this.updateScoreDisplay()
    
    // You could add more specific island updates here instead of full restart
    console.log('Islands refreshed (score updated)')
  }

  private checkWinCondition() {
    if (this.birdPopulation >= 80 && this.environmentScore >= 80 && this.isKakapoSafe()) {
      this.showFeedback('🎉 Congratulations! Perfect ecosystem achieved!', '#FFD700')
      
      // Award achievement after 3 seconds
      setTimeout(() => {
        this.exitGame()
      }, 3000)
    }
  }

  private showFeedback(message: string, color: string = '#4CAF50') {
    const feedback = document.createElement('div')
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${color};
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 16px;
      z-index: 2000;
      opacity: 0;
      transition: opacity 0.3s;
      text-align: center;
      max-width: 80vw;
      word-wrap: break-word;
    `
    feedback.textContent = message
    
    document.body.appendChild(feedback)
    
    // Animate in
    setTimeout(() => {
      feedback.style.opacity = '1'
    }, 100)
    
    // Remove after 2 seconds
    setTimeout(() => {
      feedback.style.opacity = '0'
      setTimeout(() => {
        if (feedback.parentNode) {
          document.body.removeChild(feedback)
        }
      }, 300)
    }, 2000)
  }

  private exitGame() {
    console.log('Exiting EcoGame...')
    
    // Clean up before switching scenes
    this.shutdown()
    
    // Stop this scene and resume backpack
    this.scene.stop("EcoGameScene")
    this.scene.resume("BackpackScene")
    
    // Show backpack DOM
    const backpackDom = document.getElementById('backpack-scene')
    if (backpackDom) {
      backpackDom.style.display = 'block'
    }
  }

  shutdown() {
    console.log('EcoGameScene shutdown() called')
    
    // Clean up all tweens to prevent them from affecting other scenes
    this.waveTweens.forEach(tween => {
      if (tween && tween.isActive()) {
        tween.destroy()
      }
    })
    this.waveTweens = []
    
    this.birdTweens.forEach(tween => {
      if (tween && tween.isActive()) {
        tween.destroy()
      }
    })
    this.birdTweens = []
    
    // Clean up all scene tweens as a safety measure
    this.tweens.killAll()
    
    // Clean up DOM elements using class selectors (more reliable)
    const uiElement = document.querySelector('.eco-game-ui')
    if (uiElement) {
      uiElement.remove()
    }
    
    const scoreElement = document.querySelector('.eco-game-score')
    if (scoreElement) {
      scoreElement.remove()
    }
    
    // Also clean up references
    if (this.gameUI && this.gameUI.parentNode) {
      document.body.removeChild(this.gameUI)
    }
    if (this.scorePanel && this.scorePanel.parentNode) {
      document.body.removeChild(this.scorePanel)
    }
    
    // Reset initialization flag
    this.isInitialized = false
    
    console.log('EcoGameScene cleanup complete')
  }

  destroy() {
    console.log('EcoGameScene destroy() called')
    
    // Force cleanup of all animations
    this.tweens.killAll()
    
    this.shutdown()
  }
} 