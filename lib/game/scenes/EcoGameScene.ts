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
        Phaser.Math.Between(0, this.scale.height),
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
  }

  private createIslands() {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    
    // Predator Island (left)
    const predatorIsland = this.add.ellipse(
      centerX - 200, centerY,
      180, 120,
      0x8B4513
    ).setDepth(1)
    
    // Add predator symbols
    for (let i = 0; i < this.predators; i++) {
      const predator = this.add.text(
        centerX - 220 + i * 20, centerY - 10,
        '🐺', { fontSize: '20px' }
      ).setDepth(2)
    }
    
    // Safe Island (right) - with plants and birds
    const safeIsland = this.add.ellipse(
      centerX + 200, centerY,
      180, 120,
      0x228B22
    ).setDepth(1)
    
    // Add trees
    for (let i = 0; i < this.trees; i++) {
      const tree = this.add.text(
        centerX + 180 + (i % 3) * 25, 
        centerY - 20 + Math.floor(i / 3) * 25,
        '🌳', { fontSize: '16px' }
      ).setDepth(2)
    }
    
    // Add birds
    const birdCount = Math.min(5, Math.floor(this.birdPopulation / 10))
    for (let i = 0; i < birdCount; i++) {
      const bird = this.add.text(
        centerX + 160 + i * 15, centerY + 20,
        '🐦', { fontSize: '12px' }
      ).setDepth(2)
      
      // Add flying animation
      const birdTween = this.tweens.add({
        targets: bird,
        y: bird.y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      // Store reference for cleanup
      this.birdTweens.push(birdTween)
    }
    
    // Island labels
    this.add.text(centerX - 200, centerY + 80, 'Danger Zone', {
      fontSize: '14px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3)
    
    this.add.text(centerX + 200, centerY + 80, 'Safe Haven', {
      fontSize: '14px', 
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3)
  }

  private createKakapo() {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    
    // Create kakapo on predator island (starts in danger)
    this.kakapo = this.add.sprite(centerX - 200, centerY, '')
      .setDepth(5)
      .setInteractive({ draggable: true })
    
    // Create kakapo as a colored circle with emoji
    const kakapoGraphics = this.add.graphics()
    kakapoGraphics.fillStyle(0x4a5d23)
    kakapoGraphics.fillCircle(0, 0, 15)
    kakapoGraphics.generateTexture('kakapo-sprite', 30, 30)
    kakapoGraphics.destroy()
    
    this.kakapo.setTexture('kakapo-sprite')
    
    // Add kakapo emoji on top
    const kakapoEmoji = this.add.text(centerX - 200, centerY, '🦜', {
      fontSize: '24px'
    }).setOrigin(0.5).setDepth(6)
    
    // Make emoji follow kakapo
    this.kakapo.setData('emoji', kakapoEmoji)
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
    })
    
    this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
      gameObject.x = dragX
      gameObject.y = dragY
      
      // Update emoji position
      const emoji = gameObject.getData('emoji')
      if (emoji) {
        emoji.x = dragX
        emoji.y = dragY
      }
    })
    
    this.input.on('dragend', (pointer: any, gameObject: any) => {
      this.isDragging = false
      gameObject.clearTint()
      
      // Check if kakapo reached safety
      this.checkKakapoSafety()
      this.updateScoreDisplay()
    })
  }

  private isKakapoSafe(): boolean {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2
    const safeZoneX = centerX + 200
    const distance = Phaser.Math.Distance.Between(
      this.kakapo.x, this.kakapo.y,
      safeZoneX, centerY
    )
    return distance < 100
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