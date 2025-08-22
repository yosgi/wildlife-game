import Phaser from "phaser"
import { FeedingSystem } from "../systems/FeedingSystem"
import * as THREE from "three"

interface ARSceneData {
  gameManager: any
}

export class ARScene extends Phaser.Scene {
  private arContainer?: HTMLDivElement
  private gameManager: any
  private arSystem?: any
  private currentAnimal?: any
  private feedingUI?: Phaser.GameObjects.Container
  private arInitialized = false
  private feedingSystem?: FeedingSystem
  private currentModel?: any
  private isDragging = false
  private lastPointerX = 0
  private interactionSetup = false
  private canvasEventHandlers?: any
  private speechBubble?: HTMLDivElement
  private chatInputContainer?: HTMLDivElement
  private chatInput?: HTMLInputElement
  private chatCount = 0
  private collectionUnlocked = false

  constructor() {
    super({ key: "ARScene" })
  }

  create() {
    // Get gameManager from registry (consistent with other scenes)
    this.gameManager = this.registry.get("gameManager") || (this.game as any).gameManager
    
    // Fallback: try to get from scene data if registry method fails
    if (!this.gameManager) {
      const data = this.sys.settings.data as ARSceneData | undefined
      this.gameManager = data?.gameManager
    }
    
    console.log('ARScene gameManager:', this.gameManager)
    this.feedingSystem = new FeedingSystem(this)

    this.createAROverlay()

    this.initializeARSystem()

    this.createARControls()
  }

  private createAROverlay() {
    const overlay = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.3,
      )
      .setDepth(1)
  }

  private async initializeARSystem() {
    try {
      this.arContainer = document.createElement("div")
      this.arContainer.id = "ar-container"
      this.arContainer.style.position = "absolute"
      this.arContainer.style.top = "0"
      this.arContainer.style.left = "0"
      this.arContainer.style.width = "100%"
      this.arContainer.style.height = "100%"
      this.arContainer.style.zIndex = "5"
      document.body.appendChild(this.arContainer)

      await this.setupARJS()

      this.arInitialized = true
      this.showARInstructions()
    } catch (error) {
      console.error("3D initialization failed:", error)
      this.showARFallback()
    }
  }

  private async setupARJS() {
    try {
      console.log("Setting up 3D environment with kakapo model")
      
              // Use dynamic import to avoid TypeScript errors
      const THREE = await import("three") as any
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.domElement.style.position = "absolute"
      renderer.domElement.style.top = "0px"
      renderer.domElement.style.left = "0px"
      renderer.domElement.style.zIndex = "10"
      this.arContainer?.appendChild(renderer.domElement)

      // Set camera position
      camera.position.z = 5

      // Load kakapo model
      await this.loadKakapoModel(scene, THREE)

      // Add ambient and directional lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 5)
      scene.add(directionalLight)

      this.arSystem = {
        scene,
        camera,
        renderer,
        THREE,
        isSimulation: true
      }

      this.startARRenderLoop()
      
      // Setup interaction after everything is ready
      setTimeout(() => {
        this.setupModelInteraction()
      }, 100)
    } catch (error) {
      console.error("3D setup failed:", error)
      this.showARFallback()
    }
  }

  private async loadKakapoModel(scene: any, THREE: any) {
    try {

      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
      const loader = new OBJLoader()
      
      const objPromise = new Promise<any>((resolve, reject) => {
        (loader as any).load('/kakapo/base.obj', resolve, undefined, reject)
      })

      const obj = await objPromise
      
      // 加载纹理
      const textureLoader = new THREE.TextureLoader()
      const diffuseTexture = textureLoader.load('/kakapo/texture_diffuse.png')
      const normalTexture = textureLoader.load('/kakapo/texture_normal.png')
      const roughnessTexture = textureLoader.load('/kakapo/texture_roughness.png')
      const metallicTexture = textureLoader.load('/kakapo/texture_metallic.png')

      // 创建材质
      const material = new THREE.MeshStandardMaterial({
        map: diffuseTexture,
        normalMap: normalTexture,
        roughnessMap: roughnessTexture,
        metalnessMap: metallicTexture,
        roughness: 0.8,
        metalness: 0.2
      })

      // 应用材质到模型
      obj.traverse((child: any) => {
        if (child.isMesh) {
          child.material = material
        }
      })

      // Adjust model size and position - make it larger
      obj.scale.set(1.2, 1.2, 1.2)
      obj.position.set(0, -1, 0)
      obj.rotation.y = Math.PI / 4

      scene.add(obj)

      // Store reference for rotation control
      this.currentModel = obj

      console.log("Kakapo model loaded successfully")
    } catch (error) {
      console.error("Failed to load kakapo model:", error)
      this.createFallbackKakapo(scene, THREE)
    }
  }

  private createFallbackKakapo(scene: any, THREE: any) {
    // Create a simple kakapo shape as fallback - make it larger
    const geometry = new THREE.SphereGeometry(1.2, 32, 32)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x4a5d23,
      transparent: true,
      opacity: 0.8
    })
    const kakapo = new THREE.Mesh(geometry, material)
    
    kakapo.position.set(0, 0, 0)
    scene.add(kakapo)

    // Store reference for rotation control
    this.currentModel = kakapo
  }

  private getAnimalColor(animalId: string): number {
    const colors: Record<string, number> = {
      kiwi: 0x8b4513, // Brown
      kakapo: 0x228b22, // Forest Green
      tuatara: 0x556b2f, // Dark Olive Green
      "yellow-eyed-penguin": 0x000000, // Black
    }
    return colors[animalId] || 0x888888
  }

  private startARRenderLoop() {
    if (!this.arSystem) return

    const { scene, camera, renderer } = this.arSystem

    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    animate()
  }

  private setupModelInteraction() {
    if (this.interactionSetup) {
      console.log('Interaction already setup, skipping')
      return
    }
    
    console.log('Setting up model interaction, currentModel:', this.currentModel)
    
    // Get the Three.js canvas element
    if (!this.arSystem || !this.arSystem.renderer || !this.arSystem.renderer.domElement) {
      console.log('No renderer or canvas available yet, retrying in 200ms')
      setTimeout(() => {
        this.interactionSetup = false // Reset so we can try again
        this.setupModelInteraction()
      }, 200)
      return
    }

    const canvas = this.arSystem.renderer.domElement
    console.log('Canvas found:', canvas)

    // Add event listeners directly to the Three.js canvas
    const handleMouseDown = (event: MouseEvent) => {
      this.isDragging = true
      this.lastPointerX = event.clientX
      console.log('Canvas drag started at:', event.clientX, 'currentModel exists:', !!this.currentModel)
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (this.isDragging && this.currentModel) {
        const deltaX = event.clientX - this.lastPointerX
        // Rotate model based on horizontal mouse movement
        this.currentModel.rotation.y += deltaX * 0.005
        this.lastPointerX = event.clientX
        console.log('Canvas rotating by:', deltaX * 0.005, 'new rotation:', this.currentModel.rotation.y)
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      this.isDragging = false
      console.log('Canvas drag ended')
    }

    // Add both mouse and touch events
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove) 
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp) // Stop dragging when mouse leaves canvas

    // Touch events for mobile
    canvas.addEventListener('touchstart', (event: TouchEvent) => {
      event.preventDefault()
      if (event.touches.length === 1) {
        this.isDragging = true
        this.lastPointerX = event.touches[0].clientX
        console.log('Touch drag started at:', event.touches[0].clientX)
      }
    })

    canvas.addEventListener('touchmove', (event: TouchEvent) => {
      event.preventDefault()
      if (this.isDragging && this.currentModel && event.touches.length === 1) {
        const deltaX = event.touches[0].clientX - this.lastPointerX
        this.currentModel.rotation.y += deltaX * 0.005
        this.lastPointerX = event.touches[0].clientX
        console.log('Touch rotating by:', deltaX * 0.005)
      }
    })

    canvas.addEventListener('touchend', (event: TouchEvent) => {
      event.preventDefault()
      this.isDragging = false
      console.log('Touch drag ended')
    })

    // Store references for cleanup
    this.canvasEventHandlers = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
      mouseleave: handleMouseUp
    }

    console.log('Canvas events setup completed')
    this.interactionSetup = true

    // Create speech bubble after interaction is set up
    this.createSpeechBubble()
    
    // Create chat input
    this.createChatInput()
  }

  private createSpeechBubble() {
    if (this.speechBubble) {
      return // Already created
    }

    // Create speech bubble container
    this.speechBubble = document.createElement('div')
    this.speechBubble.id = 'speech-bubble'
    
    // Apply CSS styles
    this.speechBubble.style.cssText = `
      position: absolute;
      top: 0%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #4CAF50;
      border-radius: 20px;
      padding: 20px 25px;
      max-width: 420px;
      min-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      font-family: Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #333;
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      white-space: pre-line;
    `

    // Add speech bubble tail (CSS triangle)
    const tail = document.createElement('div')
    tail.style.cssText = `
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid #4CAF50;
    `

    // Add inner tail for the background
    const innerTail = document.createElement('div')
    innerTail.style.cssText = `
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid rgba(255, 255, 255, 0.95);
    `

    // Add content
    const content = document.createElement('div')
    content.innerHTML = `
      <div style="font-weight: bold; color: #4CAF50; margin-bottom: 5px;">🦜 Kakapo</div>
      <div>Hello! I'm a kakapo parrot. Click the chat button to talk with me!</div>
    `

    this.speechBubble.appendChild(content)
    this.speechBubble.appendChild(tail)
    this.speechBubble.appendChild(innerTail)

    // Add to the body
    document.body.appendChild(this.speechBubble)

    // Animate in
    setTimeout(() => {
      if (this.speechBubble) {
        this.speechBubble.style.opacity = '1'
      }
    }, 500)

    // Auto hide after 5 seconds
    setTimeout(() => {
      this.hideSpeechBubble()
    }, 5000)

    console.log('Speech bubble created')
  }

  private showSpeechBubble(message: string) {
    if (!this.speechBubble) {
      this.createSpeechBubble()
      return
    }

    // Update content
    const content = this.speechBubble.querySelector('div')
    if (content) {
      content.innerHTML = `
        <div style="font-weight: bold; color: #4CAF50; margin-bottom: 5px;">🦜 Kakapo</div>
        <div>${message}</div>
      `
    }

    // Show bubble
    this.speechBubble.style.opacity = '1'
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      this.hideSpeechBubble()
    }, 4000)
  }

  private hideSpeechBubble() {
    if (this.speechBubble) {
      this.speechBubble.style.opacity = '0'
    }
  }

  private updateSpeechBubblePosition() {
    if (!this.speechBubble || !this.currentModel || !this.arSystem) {
      return
    }

    // Get 3D model position
    const modelPosition = this.currentModel.position.clone()
    modelPosition.y += 2 // Position above the model

    // Project 3D position to 2D screen coordinates
    const vector = modelPosition.project(this.arSystem.camera)
    
    // Convert to screen coordinates
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight

    // Update speech bubble position
    this.speechBubble.style.left = `${x}px`
    this.speechBubble.style.top = `${y - 150}px` // Position higher above the projected point
    this.speechBubble.style.transform = 'translateX(-50%)'
  }

  private createChatInput() {
    if (this.chatInputContainer) {
      return // Already created
    }

    // Create input container
    this.chatInputContainer = document.createElement('div')
    this.chatInputContainer.id = 'chat-input-container'
    
    // Apply container styles
    this.chatInputContainer.style.cssText = `
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 24px;
      padding: 8px 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 1001;
      max-width: 600px;
      width: 90%;
      min-width: 300px;
    `

    // Create input field
    this.chatInput = document.createElement('input')
    this.chatInput.type = 'text'
    this.chatInput.placeholder = 'Message Kakapo...'
    this.chatInput.style.cssText = `
      flex: 1;
      border: none;
      outline: none;
      padding: 8px 12px;
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      resize: none;
    `

    // Create voice button (placeholder)
    const voiceButton = document.createElement('button')
    voiceButton.innerHTML = '🎤'
    voiceButton.style.cssText = `
      padding: 8px;
      margin-right: 4px;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    `

    // Create send button
    const sendButton = document.createElement('button')
    sendButton.innerHTML = '➤'
    sendButton.style.cssText = `
      padding: 8px;
      border: none;
      background: #10a37f;
      color: white;
      border-radius: 12px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      min-width: 32px;
      min-height: 32px;
    `

    // Add hover effects
    voiceButton.addEventListener('mouseenter', () => {
      voiceButton.style.backgroundColor = '#f3f4f6'
    })
    voiceButton.addEventListener('mouseleave', () => {
      voiceButton.style.backgroundColor = 'transparent'
    })

    sendButton.addEventListener('mouseenter', () => {
      sendButton.style.backgroundColor = '#0d8b6b'
    })
    sendButton.addEventListener('mouseleave', () => {
      sendButton.style.backgroundColor = '#10a37f'
    })

    // Add click handlers
    voiceButton.addEventListener('click', () => {
      console.log('Voice button clicked (placeholder)')
      // Placeholder for voice functionality
    })

    sendButton.addEventListener('click', () => {
      this.sendChatMessage()
    })

    // Add enter key handler
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendChatMessage()
      }
    })

    // Assemble the container
    this.chatInputContainer.appendChild(this.chatInput)
    this.chatInputContainer.appendChild(voiceButton)
    this.chatInputContainer.appendChild(sendButton)

    // Add to body
    document.body.appendChild(this.chatInputContainer)

    console.log('Chat input created')
  }

  private async sendChatMessage() {
    if (!this.chatInput || !this.chatInput.value.trim()) {
      return
    }

    const message = this.chatInput.value.trim()
    this.chatInput.value = ''

    console.log('User message:', message)

    // Increment chat count
    this.chatCount++
    console.log('Chat count:', this.chatCount)

    // Show user is typing
    this.showSpeechBubble('Thinking...')

    // Show kakapo asking questions about itself
    setTimeout(() => {
      let response = ''
      
      if (this.chatCount === 1) {
        response = "Hello, human friend! Do you know what I like to eat?\n\nA) Leaves, fruits, and bark\nB) Fish and insects\nC) Seeds and nuts"
      } else if (this.chatCount === 2) {
        response = "Nice! Now, do you know where I prefer to live?\n\nA) Forest floors and tree cavities\nB) Ocean cliffs and beaches\nC) Mountain peaks and caves"
      } else if (this.chatCount === 3 && !this.collectionUnlocked) {
        response = "Great! One more question - what makes me special as a parrot?\n\nA) I'm the world's only flightless parrot\nB) I can swim underwater\nC) I change colors with seasons 🎉"
        this.unlockCollection()
      } else {
        const responses = [
          "You really know your kakapo facts! Want to learn more about New Zealand's unique wildlife?",
          "I'm so happy to have a knowledgeable friend like you!",
          "Thanks for learning about me and my species! 🦜",
          "Did you know we kakapos are critically endangered? Your friendship means a lot!",
          "You can always visit me here, and check your collection in the backpack!",
          "I love sharing knowledge with humans who care about wildlife! 💚"
        ]
        response = responses[Math.floor(Math.random() * responses.length)]
      }
      
      this.showSpeechBubble(response)
    }, 1500)
  }

  private unlockCollection() {
    if (this.collectionUnlocked) {
      return
    }

    this.collectionUnlocked = true
    console.log('Collection unlocked!')

    // Add kakapo to player's collection using the correct GameState method
    console.log('Attempting to unlock collection, gameManager:', this.gameManager)
    
    if (this.gameManager) {
      try {
        const gameState = this.gameManager.getGameState()
        console.log('GameState obtained:', gameState)
        
        if (gameState && typeof gameState.captureAnimal === 'function') {
          const success = gameState.captureAnimal('kakapo')
          console.log('Capture attempt result:', success)
          
          if (success) {
            console.log('Kakapo successfully added to collection!')
            
            // Increase intimacy level due to conversation bonding
            const kakapo = gameState.getAnimal('kakapo')
            console.log('Retrieved kakapo from gameState:', kakapo)
            
            if (kakapo) {
              kakapo.intimacyLevel = 3 // Higher intimacy from conversation
              console.log('Kakapo intimacy level set to 3')
            }
          } else {
            console.log('Kakapo was already in collection or capture failed')
          }
        } else {
          console.error('GameState or captureAnimal method not available. GameState:', gameState)
          console.error('Available methods:', gameState ? Object.getOwnPropertyNames(Object.getPrototypeOf(gameState)) : 'N/A')
        }
      } catch (error) {
        console.error('Failed to add kakapo to collection:', error)
      }
          } else {
        console.error('GameManager not available in ARScene')
        // Try alternative methods to get gameManager
        const altGameManager = this.registry.get("gameManager") || (this.game as any).gameManager
        console.log('Alternative gameManager search result:', altGameManager)
        
        if (altGameManager) {
          console.log('Using alternative gameManager')
          this.gameManager = altGameManager
          // Retry the unlock process
          this.unlockCollection()
          return
        }
        
        // If still no gameManager, show notification anyway for user experience
        console.log('No gameManager available, showing notification only')
      }

    // Show unlock notification
    this.showUnlockNotification()
  }

  private showUnlockNotification() {
    // Create unlock notification
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      padding: 20px 30px;
      border-radius: 15px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      z-index: 2000;
      opacity: 0;
      transition: all 0.5s ease;
      border: 2px solid #fff;
    `

    notification.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 10px;">🎉 Collection Unlocked! 🎉</div>
      <div style="font-size: 14px; opacity: 0.9;">Kakapo has been added to your backpack!</div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">You can now view your collection anytime</div>
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1'
      notification.style.transform = 'translate(-50%, -50%) scale(1.05)'
    }, 100)

    // Animate out after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translate(-50%, -50%) scale(0.95)'
      
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 500)
    }, 4000)
  }

  private createARControls() {
    const backButton = this.add.container(60, 60).setDepth(20)
    
    const backBg = this.add.rectangle(0, 0, 100, 40, 0x000000, 0.8)
    const backBorder = this.add.rectangle(0, 0, 100, 40).setStrokeStyle(2, 0xffffff)

    const backText = this.add
      .text(0, 0, "← Back", {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    backButton.add([backBg, backBorder, backText])
    
    // 设置交互 - 先设置大小，再设置交互
    backButton.setSize(100, 40)
    backButton.setInteractive({ useHandCursor: true })
    
    backButton.on("pointerdown", () => {
      this.exitARMode()
    })


  }



  private showARInstructions() {
    // No instructions needed for demo
  }

  private showARFallback() {
    // Directly start simulation mode without showing any UI
    this.startSimulationMode()
  }

  private startSimulationMode() {
    if (!this.gameManager) {
      console.error("GameManager not available")
      return
    }

    try {
      const region = this.gameManager.getGameState().getCurrentRegion()
      const animals = this.gameManager.getGameState().getAnimalsByRegion(region)

      if (animals.length > 0) {
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)]
        this.currentAnimal = randomAnimal

        this.time.delayedCall(2000, () => {
          this.simulateAnimalFound(randomAnimal)
        })
      }
    } catch (error) {
      console.error("Failed to start simulation mode:", error)
      // Create a fallback animal for demo
      this.currentAnimal = {
        id: "kakapo",
        name: "Kakapo",
        description: "A flightless parrot native to New Zealand"
      }
      this.time.delayedCall(2000, () => {
        this.simulateAnimalFound(this.currentAnimal)
      })
    }

  }

  private simulateAnimalFound(animal: any) {
    const animalContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(15)

    const animalBg = this.add.rectangle(0, 0, 250, 200, 0x000000, 0.8)
    const animalBorder = this.add.rectangle(0, 0, 250, 200).setStrokeStyle(3, 0x00ff00)

    const animalImage = this.add.image(0, -30, `${animal.id}-icon`).setScale(1.5)

    const animalName = this.add
      .text(0, 40, animal.name, {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const feedButton = this.add
      .text(0, 70, "Feed", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#4CAF50",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    feedButton.on("pointerdown", () => {
      this.feedAnimal(animal.id)
      animalContainer.destroy()
    })

    animalContainer.add([animalBg, animalBorder, animalImage, animalName, feedButton])

    animalContainer.setScale(0)
    this.tweens.add({
      targets: animalContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: "Back.easeOut",
    })
  }

  private onAnimalDetected(animal: any) {
    console.log(`Animal detected: ${animal.name}`)

    const statusText = this.data.get("statusText")
    const instructionText = this.data.get("instructionText")

    if (statusText) {
      statusText.setText(`Found ${animal.name}!`)
      statusText.setColor("#00ff00")
    }

    if (instructionText) {
      instructionText.setText("Click animal for interaction")
    }

    this.showFeedingInterface(animal)
  }

  private onAnimalLost(animal: any) {
    console.log(`Animal lost: ${animal.name}`)

    const statusText = this.data.get("statusText")
    const instructionText = this.data.get("instructionText")

    if (statusText) {
      statusText.setText("Searching for animal marker...")
      statusText.setColor("#ffffff")
    }

    if (instructionText) {
      instructionText.setText("Point your camera at the animal marker")
    }

    this.hideFeedingInterface()
  }

  private showFeedingInterface(animal: any) {
    if (this.feedingUI) {
      this.feedingUI.destroy()
    }

    if (this.feedingSystem) {
      this.feedingUI = this.feedingSystem.createFeedingInterface(
        animal,
        this.cameras.main.width - 200,
        this.cameras.main.centerY,
      )

      // Animate in from right
      this.feedingUI.setX(this.cameras.main.width + 200)
      this.tweens.add({
        targets: this.feedingUI,
        x: this.cameras.main.width - 200,
        duration: 300,
        ease: "Power2",
      })
    }
  }

  private hideFeedingInterface() {
    if (this.feedingUI) {
      this.tweens.add({
        targets: this.feedingUI,
        x: this.cameras.main.width + 200,
        duration: 300,
        ease: "Power2",
        onComplete: () => {
          this.feedingUI?.destroy()
          this.feedingUI = undefined
        },
      })
    }
  }

  private feedAnimal(animalId: string, food?: string) {
    const animal = this.gameManager.getGameState().getAnimal(animalId)
    if (!animal) return

    let success = false

    if (food) {
      success = this.gameManager.getGameState().feedAnimal(animalId, food)
    } else {
      success = this.gameManager.getGameState().captureAnimal(animalId)
    }

    if (success) {
      const successText = this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY - 100,
          `Successfully ${food ? "fed" : "captured"} ${animal.name}!\nAdded to inventory`,
          {
            fontSize: "18px",
            color: "#00ff00",
            backgroundColor: "#000000",
            padding: { x: 15, y: 10 },
            align: "center",
          },
        )
        .setOrigin(0.5)
        .setDepth(30)

      successText.setScale(0)
      this.tweens.add({
        targets: successText,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: "Back.easeOut",
        onComplete: () => {
          this.time.delayedCall(2000, () => {
            this.tweens.add({
              targets: successText,
              alpha: 0,
              duration: 500,
              onComplete: () => successText.destroy(),
            })
          })
        },
      })

      this.hideFeedingInterface()
    } else {
      const failText = this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY - 100,
          food ? `${animal.name} doesn't like ${food}` : "Capture failed",
          {
            fontSize: "16px",
            color: "#ff0000",
            backgroundColor: "#000000",
            padding: { x: 15, y: 10 },
          },
        )
        .setOrigin(0.5)
        .setDepth(30)

      this.time.delayedCall(1500, () => {
        failText.destroy()
      })
    }
  }

  private exitARMode() {
    if (this.feedingSystem) {
      this.feedingSystem.destroy()
      this.feedingSystem = undefined
    }

    if (this.arContainer) {
      document.body.removeChild(this.arContainer)
      this.arContainer = undefined
    }

    if (this.arSystem) {
      // Stop AR rendering
      this.arSystem = undefined
    }

    // Clean up speech bubble
    if (this.speechBubble) {
      document.body.removeChild(this.speechBubble)
      this.speechBubble = undefined
    }

    // Clean up chat input
    if (this.chatInputContainer) {
      document.body.removeChild(this.chatInputContainer)
      this.chatInputContainer = undefined
      this.chatInput = undefined
    }

    // Clean up model interaction
    this.currentModel = undefined
    this.isDragging = false
    this.interactionSetup = false
    
    // Reset chat state
    this.chatCount = 0
    this.collectionUnlocked = false
    
    // Remove canvas event listeners
    if (this.arSystem && this.arSystem.renderer && this.canvasEventHandlers) {
      const canvas = this.arSystem.renderer.domElement
      canvas.removeEventListener('mousedown', this.canvasEventHandlers.mousedown)
      canvas.removeEventListener('mousemove', this.canvasEventHandlers.mousemove)
      canvas.removeEventListener('mouseup', this.canvasEventHandlers.mouseup)
      canvas.removeEventListener('mouseleave', this.canvasEventHandlers.mouseleave)
      
      // Also remove touch events (using anonymous functions, so can't remove specifically)
      // But they'll be cleaned up when the canvas is removed anyway
      
      this.canvasEventHandlers = undefined
    }

    this.scene.start("MapScene")
  }

  update() {
    if (this.arInitialized && this.arSystem) {
      // AR updates are handled in the render loop
      
      // Update speech bubble position to follow the model
      this.updateSpeechBubblePosition()
    }
  }
}

