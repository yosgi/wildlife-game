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
      this.add.text(this.scale.width / 2, 50, '🎮 Eco Game - Save the Kakapo!', {
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
      ).setScale(Phaser.Math.Between(0.3, 0.6))
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
          cloud.setScale(Phaser.Math.Between(0.3, 0.6))
        }
      })
      
      this.waveTweens.push(cloudTween) // Reuse waveTweens array for all background tweens
    }
  }


  private createIslands() {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    
    // Grassland Island (left) - changed from wasteland to grassland
    const grasslandIsland = this.add.ellipse(
      centerX - 300, centerY,
      560, 400,
      0x9ACD32  // Changed to grass green color
    ).setDepth(1)
    
    // Add scattered grass clumps using food-flowers with appropriate positioning for grassland animals
    const grassPositions = [
      { x: -180, y: -120 }, { x: -100, y: -80 }, { x: -20, y: -140 },
      { x: 60, y: -100 }, { x: 140, y: -60 }, { x: -160, y: 20 },
      { x: -80, y: 60 }, { x: 0, y: -20 }, { x: 80, y: 40 },
      { x: 160, y: 80 }, { x: -120, y: 120 }, { x: 40, y: 140 }
    ]
    
    grassPositions.forEach((pos, i) => {
      // Use food-flowers as grass patches with lighter green tint
      const grass = this.add.image(
        centerX - 300 + pos.x, centerY + pos.y, "food-flowers"
      ).setScale(0.06)
       .setOrigin(0.5)
       .setDepth(2)
       .setAlpha(0.7)
       .setTint(0x7CFC00) // Bright grass green
    })
    
    // Add some pixel trees sparsely for a mixed grassland-woodland habitat
    const sparseTreePositions = [
      { x: -140, y: -40 }, { x: 80, y: -70 }, { x: -60, y: 80 }, 
      { x: 120, y: 50 }, { x: -100, y: -120 }, { x: 160, y: -20 }
    ]
    
    sparseTreePositions.forEach(pos => {
      const tree = this.add.image(
        centerX - 300 + pos.x, centerY + pos.y, "pixel-tree"
      ).setScale(0.08)
       .setOrigin(0.5)
       .setDepth(3)
       .setAlpha(0.8)
       .setTint(0x228B22) // Forest green for scattered trees
    })
    
    // Place grazing animals (using kiwi and tuatara as grassland animals)
    const grazingPositions = [
      { x: -120, y: -20 }, { x: 20, y: 30 }, { x: 100, y: -50 },
      { x: -40, y: 100 }, { x: 80, y: -100 }
    ]
    
    for (let i = 0; i < this.predators && i < grazingPositions.length; i++) {
      const pos = grazingPositions[i]
      const animalTypes = ['kiwi-icon', 'tuatara-icon'] // Ground-dwelling grassland animals
      const animal = this.add.image(
        centerX - 300 + pos.x, centerY + pos.y,
        animalTypes[i % 2]
      ).setScale(0.06)
       .setOrigin(0.5)
       .setDepth(4)
       .setAlpha(0.9) // Normal animals, not threatening
    }
    
    // Safe Island (right) - forest sanctuary with strategic forest placement
    const safeIsland = this.add.rectangle(
      centerX + 300, centerY,
      640, 480,
      0x228B22
    ).setDepth(1)
    
    // Strategic forest background placement - create natural clusters for birds
    const forestClusters = [
      { x: -120, y: -80, scale: 0.4 }, // North cluster for canopy birds
      { x: 80, y: -60, scale: 0.35 },  // Northeast cluster  
      { x: -60, y: 40, scale: 0.45 },  // South cluster for ground foragers
      { x: 100, y: 80, scale: 0.4 }    // Southeast cluster
    ]
    
    forestClusters.forEach(cluster => {
      const forestBg = this.add.image(
        centerX + 300 + cluster.x, centerY + cluster.y, "forest"
      ).setScale(cluster.scale)
       .setDepth(2)
       .setAlpha(0.6)
    })
    
    // Individual pixel trees strategically placed for different bird types
    const strategicTreePositions = [
      { x: -200, y: -100, type: 'canopy' },   // Tall trees for aerial birds
      { x: -140, y: -40, type: 'mid' },      // Mid-level for perching
      { x: -80, y: -120, type: 'canopy' },   // Forest edge
      { x: 0, y: -80, type: 'mid' },         // Central perching
      { x: 80, y: -110, type: 'canopy' },    // North edge
      { x: 140, y: -50, type: 'mid' },       // Open woodland
      { x: 200, y: -90, type: 'canopy' },    // East canopy
      { x: -100, y: 60, type: 'under' },     // Understory for ground birds
      { x: 60, y: 100, type: 'under' }       // Southern understory
    ]
    
    for (let i = 0; i < this.trees && i < strategicTreePositions.length; i++) {
      const pos = strategicTreePositions[i]
      const x = centerX + 300 + pos.x
      const y = centerY + pos.y
      
      if (pos.type === 'canopy') {
        // Tall canopy trees using pixel-tree - reduced size
        const tree = this.add.image(x, y, "pixel-tree")
          .setScale(Phaser.Math.Between(0.10, 0.14))  // Reduced from 0.15-0.20
          .setOrigin(0.5)
          .setDepth(3)
          .setTint(0x228B22)
      } else if (pos.type === 'mid') {
        // Medium trees using smaller forest pieces
        const tree = this.add.image(x, y, "forest")
          .setScale(0.10)  // Reduced from 0.12
          .setDepth(3)
          .setAlpha(0.9)
      } else {
        // Understory using food-flowers as bushes
        const bush = this.add.image(x, y, "food-flowers")
          .setScale(0.06)  // Reduced from 0.08
          .setOrigin(0.5)
          .setDepth(3)
          .setTint(0x32CD32)
          .setAlpha(0.8)
      }
    }
    
    // Flowering plants strategically placed near trees for nectar-feeding birds
    const flowerPatches = [
      { x: -160, y: -20 }, { x: -40, y: -60 }, { x: 120, y: -30 }, { x: 40, y: 120 }
    ]
    
    flowerPatches.forEach(patch => {
      const flower = this.add.image(
        centerX + 300 + patch.x, centerY + patch.y, "food-flowers"
      ).setScale(0.07)
       .setOrigin(0.5)
       .setDepth(3)
       .setAlpha(0.9)
    })
    
    // Birds positioned according to their preferred habitats
    const birdCount = Math.min(4, Math.floor(this.birdPopulation / 16))
    const birdHabitats = [
      { x: -140, y: -100, type: 'penguin-icon' }, // Near water edge (penguins)
      { x: -60, y: -40, type: 'kiwi-icon' },      // Forest floor (kiwi)  
      { x: 80, y: -80, type: 'kakapo-icon' },     // Tree canopy (kakapo)
      { x: 160, y: 60, type: 'kiwi-icon' }        // Open woodland (kiwi)
    ]
    
    for (let i = 0; i < birdCount && i < birdHabitats.length; i++) {
      const habitat = birdHabitats[i]
      const bird = this.add.image(
        centerX + 300 + habitat.x, centerY + habitat.y,
        habitat.type
      ).setScale(0.05)
       .setOrigin(0.5)
       .setDepth(5)
      
      // Add flying animation with random delays
      const birdTween = this.tweens.add({
        targets: bird,
        y: bird.y - Phaser.Math.Between(5, 12),
        duration: Phaser.Math.Between(1200, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000)
      })
      
      // Store reference for cleanup
      this.birdTweens.push(birdTween)
    }
    
    // Island labels with updated names
    this.add.text(centerX - 300, centerY + 220, 'GRASSLAND', {
      fontSize: '18px',
      color: '#32CD32',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6)
    
    this.add.text(centerX + 300, centerY + 260, 'FOREST SANCTUARY', {
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
      { text: '🌳 Plant Tree', action: 'plant', cost: 'Env -5, Birds +10' },
      { text: '🪓 Cut Tree', action: 'cut', cost: 'Env +5, Birds -15' },
      { text: '🍎 Feed Birds', action: 'feed', cost: 'Birds +5' }
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
        🎮 Eco Game - ${this.animal?.name || 'Kakapo'}
      </div>
      <div style="margin-bottom: 5px;">
        🦜 Bird Population: ${this.birdPopulation}
      </div>
      <div style="margin-bottom: 5px;">
        🌍 Environment: ${this.environmentScore}
      </div>
      <div style="margin-bottom: 5px;">
        🌳 Trees: ${this.trees}
      </div>
      <div style="margin-bottom: 5px;">
        🐺 Predators: ${this.predators}
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
    const safeZoneX = centerX + 300 // Updated to match new larger forest island position
    const distance = Phaser.Math.Distance.Between(
      this.kakapo.x, this.kakapo.y,
      safeZoneX, centerY
    )
    return distance < 320 // Doubled safe zone for the much larger forest island (640/2)
  }

  private checkKakapoSafety() {
    const isSafe = this.isKakapoSafe()
    
    if (isSafe) {
      this.showFeedback('🟢 Kakapo is safe! Birds +2, Environment +1', '#4CAF50')
      this.birdPopulation = Math.min(100, this.birdPopulation + 2)
      this.environmentScore = Math.min(100, this.environmentScore + 1)
    } else {
      this.showFeedback('🔴 Kakapo is in danger! Birds -3', '#ff4444')
      this.birdPopulation = Math.max(0, this.birdPopulation - 3)
    }
  }

  private handleAction(action: string) {
    switch (action) {
      case 'plant':
        if (this.environmentScore >= 5) {
          this.trees++
          this.environmentScore -= 5
          this.birdPopulation = Math.min(100, this.birdPopulation + 10)
          this.showFeedback('🌳 Tree planted! Birds love it!', '#4CAF50')
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
          this.showFeedback('🪓 Tree cut! Birds lost habitat!', '#ff8800')
          this.refreshIslands()
        } else {
          this.showFeedback('❌ No trees to cut!', '#ff4444')
        }
        break
        
      case 'feed':
        this.birdPopulation = Math.min(100, this.birdPopulation + 5)
        this.showFeedback('🍎 Birds fed! Population increased!', '#4CAF50')
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