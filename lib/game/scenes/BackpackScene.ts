import Phaser from "phaser"
import type { Animal } from "../GameState"
import { AIEducationService, type EducationalContent, type QuizQuestion } from "../services/AIEducationService"

export class BackpackScene extends Phaser.Scene {
  private gameManager: any
  private selectedAnimal?: Animal
  private filterMode: "all" | "north" | "south" = "all"
  private sortMode: "name" | "intimacy" | "recent" = "name"
  private aiEducationService!: AIEducationService

  // DOM Elements
  private domContainer!: HTMLDivElement
  private headerElement!: HTMLDivElement
  private contentElement!: HTMLDivElement
  private modalElement!: HTMLDivElement

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
    super({ key: "BackpackScene" })
  }

  create() {
    this.gameManager = (this.game as any).gameManager
    this.aiEducationService = new AIEducationService()

    this.createDOMContainer()
    this.createBackground()
    this.setupDOMInterface()
    
    // Add window resize listener
    this.setupResizeHandler()
  }

  private setupResizeHandler() {
    const handleResize = () => {
      // Recreate interface to adapt to new screen size
      if (this.domContainer) {
        this.domContainer.remove()
      }
      if (this.modalElement) {
        this.modalElement.remove()
      }
      
      this.createDOMContainer()
      this.setupDOMInterface()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', () => {
      // Delay handling when screen rotates, wait for rotation to complete
      setTimeout(handleResize, 100)
    })
  }

  private createDOMContainer() {
    // 创建主DOM容器
    this.domContainer = document.createElement('div')
    this.domContainer.id = 'backpack-scene'
    this.domContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: 
        repeating-linear-gradient(
          0deg,
          #1a1a2e 0px,
          #1a1a2e 2px,
          #16213e 2px,
          #16213e 4px
        ),
        repeating-linear-gradient(
          90deg,
          #1a1a2e 0px,
          #1a1a2e 2px,
          #16213e 2px,
          #16213e 4px
        );
      background-size: 4px 4px;
      z-index: 1000;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
      touch-action: pan-y;
      -webkit-overflow-scrolling: touch;
    `
    
    // 添加像素风格CSS - 移动端优化
    const pixelStyle = document.createElement('style')
    pixelStyle.textContent = `
      .pixel-btn {
        font-family: 'Courier New', monospace !important;
        font-weight: bold !important;
        border: 3px solid #333 !important;
        padding: 8px 16px !important;
        margin-right: 8px !important;
        margin-bottom: 8px !important;
        cursor: pointer !important;
        transition: all 0.1s !important;
        background: #333 !important;
        color: #fff !important;
        text-shadow: 1px 1px 0 #000 !important;
        box-shadow: 3px 3px 0 #222 !important;
        font-size: 12px !important;
        min-height: 36px !important;
        min-width: 36px !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      .pixel-btn:hover {
        transform: translate(-1px, -1px) !important;
        box-shadow: 4px 4px 0 #222 !important;
      }
      .pixel-btn:active {
        transform: translate(1px, 1px) !important;
        box-shadow: 2px 2px 0 #222 !important;
      }
      .pixel-btn.active {
        background: #4CAF50 !important;
        border-color: #2E7D32 !important;
        color: #000 !important;
        text-shadow: 1px 1px 0 #fff !important;
        box-shadow: 3px 3px 0 #2E7D32 !important;
      }
      .pixel-card {
        background: rgba(42, 42, 62, 0.95) !important;
        border: 4px solid #4CAF50 !important;
        padding: 20px !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        position: relative !important;
        overflow: hidden !important;
        box-shadow: 4px 4px 0 rgba(76, 175, 80, 0.3) !important;
        min-height: 120px !important;
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      .pixel-card:hover {
        transform: scale(1.05) translate(-2px, -2px) !important;
        border-color: #8BC34A !important;
        box-shadow: 6px 6px 0 rgba(76, 175, 80, 0.5) !important;
      }
      .unknown-card:hover {
        transform: scale(1.02) translate(-1px, -1px) !important;
        border-color: #888888 !important;
        box-shadow: 5px 5px 0 rgba(102, 102, 102, 0.4) !important;
        filter: grayscale(0.6) brightness(0.8) !important;
      }
      
      /* 移动端优化 */
      @media (max-width: 768px) {
        .pixel-btn {
          padding: 12px 20px !important;
          font-size: 14px !important;
          margin-right: 8px !important;
          margin-bottom: 8px !important;
          min-height: 40px !important;
          min-width: 40px !important;
        }
        
        .pixel-card {
          padding: 24px !important;
          min-height: 140px !important;
        }
        
        #animals-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
          padding: 0 16px !important;
        }
        
        .controls-container {
          flex-direction: column !important;
          gap: 16px !important;
        }
        
        .controls-section {
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }
        
        .controls-section > div {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
        }
      }
    `
    document.head.appendChild(pixelStyle)
    
    // 添加到body
    document.body.appendChild(this.domContainer)
  }

  private createBackground() {
    // Phaser背景保持简单
    const bg = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x1a1a2e,
    )
  }

  private setupDOMInterface() {
    this.createDOMHeader()
    this.createDOMContent()
    this.createDOMModal()
    this.loadAnimals()
  }

  private createDOMHeader() {
    this.headerElement = document.createElement('div')
    this.headerElement.style.cssText = `
      padding: 20px;
      background: 
        repeating-linear-gradient(
          0deg,
          #2a2a3e 0px,
          #2a2a3e 2px,
          #222233 2px,
          #222233 4px
        );
      background-size: 4px 4px;
      border-bottom: 6px solid #4CAF50;
      border-image: 
        repeating-linear-gradient(
          90deg,
          #4CAF50 0px,
          #4CAF50 8px,
          #6BC76B 8px,
          #6BC76B 16px
        ) 6;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 8px 0 rgba(76, 175, 80, 0.3);
    `

    const capturedAnimals = this.gameManager.getGameState().getCapturedAnimals()
    const totalAnimals = this.gameManager.getGameState().getAllAnimals().length
    const isMobile = window.innerWidth < 768

    this.headerElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; flex-wrap: wrap; gap: 16px;">
        <button id="back-button" style="
          background: 
            repeating-linear-gradient(
              45deg,
              #4CAF50 0px,
              #4CAF50 4px,
              #6BC76B 4px,
              #6BC76B 8px
            );
          color: #000000;
          border: 4px solid #2E7D32;
          padding: ${isMobile ? '12px 20px' : '10px 16px'};
          font-size: ${isMobile ? '14px' : '12px'};
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          text-shadow: 1px 1px 0 #ffffff;
          box-shadow: 
            4px 4px 0 #2E7D32,
            8px 8px 0 rgba(0,0,0,0.3);
          transition: all 0.1s;
          min-height: ${isMobile ? '44px' : '40px'};
          min-width: ${isMobile ? '44px' : '40px'};
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        " onmouseover="
          this.style.transform = 'translate(-2px, -2px)';
          this.style.boxShadow = '6px 6px 0 #2E7D32, 10px 10px 0 rgba(0,0,0,0.3)';
        " onmouseout="
          this.style.transform = 'translate(0, 0)';
          this.style.boxShadow = '4px 4px 0 #2E7D32, 8px 8px 0 rgba(0,0,0,0.3)';
        " onmousedown="
          this.style.transform = 'translate(2px, 2px)';
          this.style.boxShadow = '2px 2px 0 #2E7D32, 4px 4px 0 rgba(0,0,0,0.3)';
        " ontouchstart="
          if('vibrate' in navigator) navigator.vibrate(30);
        ">← Back</button>
        
        <div style="text-align: center; flex: 1; min-width: 0;">
          <h1 style="
            margin: 0; 
            color: #4CAF50; 
            font-size: ${isMobile ? '20px' : '24px'};
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-shadow: 4px 4px 0 #1a1a2e, 8px 8px 0 rgba(0,0,0,0.3);
            letter-spacing: 2px;
            word-wrap: break-word;
          "> Animal Collection</h1>
          <p style="
            margin: 8px 0 0 0; 
            color: #ffffff; 
            font-size: ${isMobile ? '14px' : '16px'};
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 0 #1a1a2e;
          ">
            Captured: ${capturedAnimals.length}/${totalAnimals}
          </p>
        </div>
        
        <div style="width: ${isMobile ? '60px' : '100px'};"></div>
      </div>
    `

    // Add back button event
    this.headerElement.querySelector('#back-button')?.addEventListener('click', () => {
      // Mobile haptic feedback
      this.safeVibrate(30)
      this.exitBackpack()
    })

    this.domContainer.appendChild(this.headerElement)
  }

  private createDOMContent() {
    this.contentElement = document.createElement('div')
    this.contentElement.style.cssText = `
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    `

    const isMobile = window.innerWidth < 768

    // 筛选和排序控件 - 移动端优化
    const controlsHTML = `
      <div style="background: rgba(42, 42, 62, 0.9); padding: ${isMobile ? '20px' : '20px'}; border: 4px solid #4CAF50; margin-bottom: 30px; box-shadow: 8px 8px 0 rgba(76, 175, 80, 0.3);">
        <div class="controls-container" style="display: flex; flex-direction: column; gap: ${isMobile ? '16px' : '20px'};">
          <div class="controls-section">
            <label style="color: #4CAF50; font-size: ${isMobile ? '14px' : '14px'}; margin-bottom: 8px; font-family: 'Courier New', monospace; font-weight: bold; text-shadow: 2px 2px 0 #1a1a2e; display: block;">Filter:</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="filter-btn pixel-btn active" data-filter="all">All</button>
              <button class="filter-btn pixel-btn" data-filter="north">North Island</button>
              <button class="filter-btn pixel-btn" data-filter="south">South Island</button>
            </div>
          </div>
          <div class="controls-section">
            <label style="color: #4CAF50; font-size: ${isMobile ? '14px' : '14px'}; margin-bottom: 8px; font-family: 'Courier New', monospace; font-weight: bold; text-shadow: 2px 2px 0 #1a1a2e; display: block;">Sort:</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="sort-btn pixel-btn active" data-sort="name">Name</button>
              <button class="sort-btn pixel-btn" data-sort="intimacy">Intimacy</button>
              <button class="sort-btn pixel-btn" data-sort="recent">Recent</button>
            </div>
          </div>
        </div>
      </div>
      <div id="animals-grid" style="
        display: grid;
        grid-template-columns: ${isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))'};
        gap: ${isMobile ? '16px' : '20px'};
        margin-top: 20px;
        ${isMobile ? 'padding: 0 16px;' : ''}
      "></div>
    `

    this.contentElement.innerHTML = controlsHTML
    this.domContainer.appendChild(this.contentElement)

    // 添加控件事件监听器
    this.setupControlEvents()
  }

  private setupControlEvents() {
    // Filter buttons
    this.contentElement.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement
        const filter = target.dataset.filter as "all" | "north" | "south"
        
        // Mobile haptic feedback
        this.safeVibrate(20)
        
        this.setFilter(filter)
        this.updateControlButtons()
        this.loadAnimals()
      })
    })

    // Sort buttons
    this.contentElement.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement
        const sort = target.dataset.sort as "name" | "intimacy" | "recent"
        
        // Mobile haptic feedback
        this.safeVibrate(20)
        
        this.setSort(sort)
        this.updateControlButtons()
        this.loadAnimals()
      })
    })
  }

  private updateControlButtons() {
    // Update filter button styles
    this.contentElement.querySelectorAll('.filter-btn').forEach(btn => {
      const button = btn as HTMLButtonElement
      if (button.dataset.filter === this.filterMode) {
        button.style.background = '#4CAF50'
      } else {
        button.style.background = '#333333'
      }
    })

    // Update sort button styles
    this.contentElement.querySelectorAll('.sort-btn').forEach(btn => {
      const button = btn as HTMLButtonElement
      if (button.dataset.sort === this.sortMode) {
        button.style.background = '#2196F3'
      } else {
        button.style.background = '#333333'
      }
    })
  }

  private loadAnimals() {
    const animalsGrid = this.contentElement.querySelector('#animals-grid') as HTMLDivElement
    const allAnimals = this.getAllAnimalsForDisplay()
    const capturedAnimals = this.gameManager.getGameState().getCapturedAnimals()

    // Create cards for all animals (including uncollected ones)
    animalsGrid.innerHTML = allAnimals.map(animal => {
      const isCaptured = capturedAnimals.some((captured: Animal) => captured.id === animal.id)
      const capturedAnimal = isCaptured ? capturedAnimals.find((captured: Animal) => captured.id === animal.id) : null
      
      return isCaptured 
        ? this.createAnimalCardHTML(capturedAnimal!)
        : this.createUnknownAnimalCardHTML(animal)
    }).join('')

    // Add card click events
    animalsGrid.querySelectorAll('.animal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const animalId = (e.currentTarget as HTMLElement).dataset.animalId
        const isCaptured = (e.currentTarget as HTMLElement).dataset.captured === 'true'
        
        // Mobile haptic feedback
        this.safeVibrate(50)
        
        if (isCaptured) {
          const animal = capturedAnimals.find((a: Animal) => a.id === animalId)
          if (animal) {
            this.selectAnimal(animal)
          }
        } else {
          // Show uncollected hint
          this.showFeedback('❓ This animal has not been discovered yet, continue exploring!')
        }
      })
    })
  }

  private createAnimalCardHTML(animal: Animal): string {
    const statusColors = {
      'Critically Endangered': '#ff0000',
      'Endangered': '#ff4444',
      'Vulnerable': '#ff8800',
      'Near Threatened': '#ffaa00',
      'Least Concern': '#4caf50',
    }
    const statusColor = statusColors[animal.conservationStatus as keyof typeof statusColors] || '#888888'
    
    const hearts = Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(animal.intimacyLevel / 2)
      const half = i === Math.floor(animal.intimacyLevel / 2) && animal.intimacyLevel % 2 === 1
      return filled ? '♥' : (half ? '♡' : '♤')
    }).join(' ')

    const isMobile = window.innerWidth < 768
    const emojiSize = isMobile ? '40px' : '48px'
    const titleSize = isMobile ? '16px' : '18px'
    const heartSize = isMobile ? '14px' : '16px'
    const descSize = isMobile ? '12px' : '14px'

    return `
      <div class="animal-card pixel-card" data-animal-id="${animal.id}" data-captured="true">
        <div style="
          position: absolute; 
          top: 8px; 
          right: 8px; 
          width: 16px; 
          height: 16px; 
          background: ${statusColor}; 
          border: 2px solid #000;
          image-rendering: pixelated;
        "></div>
        
        <div style="text-align: center;">
          <div style="
            font-size: ${emojiSize}; 
            margin-bottom: 15px; 
            filter: contrast(1.2) saturate(1.1);
            image-rendering: pixelated;
          ">🦜</div>
          <h3 style="
            margin: 0 0 15px 0; 
            color: #4CAF50; 
            font-size: ${titleSize};
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-shadow: 2px 2px 0 #1a1a2e, 4px 4px 0 rgba(0,0,0,0.3);
            letter-spacing: 1px;
          ">${animal.name}</h3>
          <div style="
            font-size: ${heartSize}; 
            margin-bottom: 12px;
            color: #ff4444;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          ">${hearts}</div>
          <div style="
            color: #ffffff; 
            font-size: ${descSize};
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-shadow: 1px 1px 0 #000;
            background: rgba(0,0,0,0.3);
            padding: 4px 8px;
            border: 1px solid #4CAF50;
          ">Intimacy: ${animal.intimacyLevel}/10</div>
        </div>
      </div>
    `
  }

  private createUnknownAnimalCardHTML(animal: Animal): string {
    const isMobile = window.innerWidth < 768
    const emojiSize = isMobile ? '40px' : '48px'
    const titleSize = isMobile ? '16px' : '18px'
    const descSize = isMobile ? '12px' : '14px'
    
    return `
      <div class="animal-card pixel-card unknown-card" data-animal-id="${animal.id}" data-captured="false" style="
        background: rgba(20, 20, 30, 0.95) !important;
        border: 4px solid #666666 !important;
        box-shadow: 4px 4px 0 rgba(102, 102, 102, 0.3) !important;
        filter: grayscale(0.8) brightness(0.6);
      ">
        <div style="
          position: absolute; 
          top: 8px; 
          right: 8px; 
          width: 16px; 
          height: 16px; 
          background: #666666; 
          border: 2px solid #000;
          image-rendering: pixelated;
        "></div>
        
        <div style="text-align: center;">
          <div style="
            font-size: ${emojiSize}; 
            margin-bottom: 15px; 
            image-rendering: pixelated;
            opacity: 0.3;
          ">❓</div>
          <h3 style="
            margin: 0 0 15px 0; 
            color: #666666; 
            font-size: ${titleSize};
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-shadow: 2px 2px 0 #000;
            letter-spacing: 1px;
          ">Unknown Animal</h3>
          <div style="
            font-size: ${descSize}; 
            margin-bottom: 12px;
            color: #444444;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
          ">? ? ? ? ?</div>
          <div style="
            color: #666666; 
            font-size: ${descSize};
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-shadow: 1px 1px 0 #000;
            background: rgba(0,0,0,0.5);
            padding: 4px 8px;
            border: 1px solid #666666;
          ">Discover it!</div>
        </div>
      </div>
    `
  }

  private createDOMModal() {
    this.modalElement = document.createElement('div')
    this.modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    `
    document.body.appendChild(this.modalElement)
  }

  private selectAnimal(animal: Animal) {
    this.selectedAnimal = animal
    console.log("Selected animal:", animal.name)
    this.showAnimalModal(animal)
  }

  private showAnimalModal(animal: Animal) {
    const isMobile = window.innerWidth < 768
    const modalPadding = isMobile ? '20px' : '32px'
    const emojiSize = isMobile ? '48px' : '72px'
    const titleSize = isMobile ? '20px' : '28px'
    const textSize = isMobile ? '14px' : '16px'
    const buttonPadding = isMobile ? '16px 24px' : '12px 20px'
    const buttonSize = isMobile ? '16px' : '14px'
    
    const modalContent = `
      <div style="
        background: 
          repeating-linear-gradient(
            0deg,
            #1a1a2e 0px,
            #1a1a2e 4px,
            #16213e 4px,
            #16213e 8px
          );
        background-size: 8px 8px;
        border: 6px solid #4CAF50;
        padding: ${modalPadding};
        max-width: 700px;
        width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 
          8px 8px 0 #2E7D32,
          16px 16px 0 rgba(0,0,0,0.3);
        font-family: 'Courier New', monospace;
        touch-action: pan-y;
      ">
        <button id="close-modal" style="
          position: absolute;
          top: ${isMobile ? '12px' : '20px'};
          right: ${isMobile ? '18px' : '25px'};
          background: #ff4444;
          border: 4px solid #cc0000;
          color: #ffffff;
          font-size: ${isMobile ? '32px' : '28px'};
          font-weight: bold;
          cursor: pointer;
          width: ${isMobile ? '48px' : '40px'};
          height: ${isMobile ? '48px' : '40px'};
          font-family: 'Courier New', monospace;
          box-shadow: 4px 4px 0 #cc0000;
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        ">×</button>
        
        <div style="text-align: center; margin-bottom: ${isMobile ? '24px' : '40px'};">
          <div style="
            font-size: ${emojiSize}; 
            margin-bottom: 20px;
            filter: contrast(1.2) saturate(1.1);
            image-rendering: pixelated;
          ">🦜</div>
          <h2 style="
            margin: 0; 
            color: #4CAF50; 
            font-size: ${titleSize};
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-shadow: 4px 4px 0 #1a1a2e, 8px 8px 0 rgba(0,0,0,0.5);
            letter-spacing: 2px;
          ">${animal.name}</h2>
          <p style="
            color: #ffffff; 
            margin: 15px 0;
            font-size: ${textSize};
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 0 #000;
          ">Conservation Status: ${animal.conservationStatus}</p>
          <p style="
            color: #ffffff; 
            margin: 15px 0;
            font-size: ${textSize};
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 0 #000;
          ">Habitat: ${animal.habitat}</p>
          <p style="
            color: #ffffff; 
            margin: 15px 0;
            font-size: ${textSize};
            font-family: 'Courier New', monospace;
            text-shadow: 2px 2px 0 #000;
          ">Intimacy: ${animal.intimacyLevel}/10</p>
        </div>

        <div style="display: flex; gap: ${isMobile ? '12px' : '20px'}; justify-content: center; flex-wrap: wrap;">
          <button id="feed-animal" class="pixel-btn" style="
            background: #4CAF50 !important;
            border: 4px solid #2E7D32 !important;
            color: #000000 !important;
            padding: ${buttonPadding} !important;
            font-size: ${buttonSize} !important;
            font-family: 'Courier New', monospace !important;
            font-weight: bold !important;
            cursor: pointer !important;
            text-shadow: 1px 1px 0 #ffffff !important;
            box-shadow: 4px 4px 0 #2E7D32 !important;
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          ">🍎 Feed</button>
          
          <button id="learn-animal" class="pixel-btn" style="
            background: #2196F3 !important;
            border: 4px solid #1565C0 !important;
            color: #000000 !important;
            padding: ${buttonPadding} !important;
            font-size: ${buttonSize} !important;
            font-family: 'Courier New', monospace !important;
            font-weight: bold !important;
            cursor: pointer !important;
            text-shadow: 1px 1px 0 #ffffff !important;
            box-shadow: 4px 4px 0 #1565C0 !important;
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          ">📚 Learn</button>
          
          <button id="quiz-animal" class="pixel-btn" style="
            background: #FF9800 !important;
            border: 4px solid #F57C00 !important;
            color: #000000 !important;
            padding: ${buttonPadding} !important;
            font-size: ${buttonSize} !important;
            font-family: 'Courier New', monospace !important;
            font-weight: bold !important;
            cursor: pointer !important;
            text-shadow: 1px 1px 0 #ffffff !important;
            box-shadow: 4px 4px 0 #F57C00 !important;
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          ">🧠 Quiz</button>
        </div>
      </div>
    `

    this.modalElement.innerHTML = modalContent
    this.modalElement.style.display = 'flex'

    // Add event listeners
    this.modalElement.querySelector('#close-modal')?.addEventListener('click', () => {
      // Mobile haptic feedback
      this.safeVibrate(30)
      this.closeModal()
    })

    this.modalElement.querySelector('#feed-animal')?.addEventListener('click', () => {
      // Mobile haptic feedback
      this.safeVibrate(50)
      this.feedAnimal(animal)
    })

    this.modalElement.querySelector('#learn-animal')?.addEventListener('click', () => {
      // Mobile haptic feedback
      this.safeVibrate(50)
      this.showEducationalContent(animal)
    })

    this.modalElement.querySelector('#quiz-animal')?.addEventListener('click', () => {
      // Mobile haptic feedback
      this.safeVibrate(50)
      this.startQuiz(animal)
    })

    // Close on clicking outside modal
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.closeModal()
      }
    })
  }

  private closeModal() {
    this.modalElement.style.display = 'none'
    this.modalElement.innerHTML = ''
  }

  private feedAnimal(animal: Animal) {
    // 简单的喂食逻辑
    animal.intimacyLevel = Math.min(animal.intimacyLevel + 1, 10)
    animal.lastFed = new Date()
    
    this.closeModal()
    this.loadAnimals() // 刷新显示
    
    // 显示反馈
    this.showFeedback(`🍎 ${animal.name} is happy! Intimacy +1`)
  }

  private showFeedback(message: string) {
    const isMobile = window.innerWidth < 768
    const feedback = document.createElement('div')
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #4CAF50;
      color: white;
      padding: ${isMobile ? '24px 36px' : '20px 30px'};
      border-radius: 8px;
      font-size: ${isMobile ? '20px' : '18px'};
      font-family: 'Courier New', monospace;
      font-weight: bold;
      z-index: 3000;
      animation: fadeInOut 2s forwards;
      box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
      text-align: center;
      max-width: 90vw;
      word-wrap: break-word;
    `
    feedback.textContent = message

    document.body.appendChild(feedback)

    setTimeout(() => {
      if (feedback.parentNode) {
        document.body.removeChild(feedback)
      }
    }, 2000)
  }

  private exitBackpack() {
    // 清理DOM元素
    if (this.domContainer && this.domContainer.parentNode) {
      this.domContainer.parentNode.removeChild(this.domContainer)
    }
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.removeChild(this.modalElement)
    }
    
    // 返回主菜单场景
    this.scene.start("MainMenuScene")
  }

  destroy() {
    // 场景销毁时清理DOM
    this.exitBackpack()
  }

  // 以下是简化的辅助方法
  private async showEducationalContent(animal: Animal) {
    this.closeModal()
    this.showFeedback(`📚 Preparing educational content for ${animal.name}...`)
  }

  private async startQuiz(animal: Animal) {
    this.closeModal()
    this.showFeedback(`🧠 Preparing quiz for ${animal.name}...`)
  }

  private setFilter(mode: "all" | "north" | "south") {
    this.filterMode = mode
  }

  private setSort(mode: "name" | "intimacy" | "recent") {
    this.sortMode = mode
  }

  private getFilteredAndSortedAnimals(): Animal[] {
    let animals = this.gameManager.getGameState().getCapturedAnimals()

    // 筛选
    if (this.filterMode !== "all") {
      animals = animals.filter((animal: Animal) => animal.region === this.filterMode || animal.region === "both")
    }

    // 排序
    animals.sort((a: Animal, b: Animal) => {
      switch (this.sortMode) {
        case "name":
          return a.name.localeCompare(b.name)
        case "intimacy":
          return b.intimacyLevel - a.intimacyLevel
        case "recent":
          const aTime = a.lastFed ? a.lastFed.getTime() : 0
          const bTime = b.lastFed ? b.lastFed.getTime() : 0
          return bTime - aTime
        default:
          return 0
      }
    })

    return animals
  }

  private getAllAnimalsForDisplay(): Animal[] {
    let allAnimals = this.gameManager.getGameState().getAllAnimals()

    // 筛选
    if (this.filterMode !== "all") {
      allAnimals = allAnimals.filter((animal: Animal) => animal.region === this.filterMode || animal.region === "both")
    }

    // 排序（按名称排序以保持一致的顺序）
    allAnimals.sort((a: Animal, b: Animal) => {
      switch (this.sortMode) {
        case "name":
          return a.name.localeCompare(b.name)
        case "intimacy":
        case "recent":
          // 对于未收集的动物，也按名称排序
          return a.name.localeCompare(b.name)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return allAnimals
  }
}
