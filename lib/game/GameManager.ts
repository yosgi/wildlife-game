import { GameState } from "./GameState"
import { MainMenuScene } from "./scenes/MainMenuScene"
import { MapScene } from "./scenes/MapScene"
import { ARScene } from "./scenes/ARScene"
import { BackpackScene } from "./scenes/BackpackScene"

export class GameManager {
  private container: HTMLElement
  private gameState: GameState
  private currentScene: any
  private phaserGame: any

  constructor(container: HTMLElement) {
    this.container = container
    this.gameState = new GameState()
  }

  async initialize() {
    // Hide loading screen after initialization
    setTimeout(() => {
      const loadingScreen = document.getElementById("loading-screen")
      if (loadingScreen) {
        loadingScreen.style.display = "none"
      }
    }, 2000)

    // Initialize Phaser game
    await this.initializePhaser()
  }

  private async initializePhaser() {
    // Dynamic import Phaser to avoid SSR issues
    const Phaser = await import("phaser")

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: this.container,
      backgroundColor: "#87CEEB",
      scene: [MainMenuScene, MapScene, ARScene, BackpackScene],
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      // 移动端优化配置
      input: {
        touch: {
          target: this.container,
          capture: true
        }
      },
      render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        powerPreference: "high-performance"
      },
      // 移动端性能优化
      fps: {
        target: 60,
        forceSetTimeOut: true
      },
      // 防止移动端缩放
      dom: {
        createContainer: true
      }
    }

    this.phaserGame = new Phaser.Game(config)
    this.phaserGame.gameManager = this
    
    // 在registry中注册gameManager，这样所有场景都能访问
    this.phaserGame.registry.set("gameManager", this)
    console.log("GameManager registered in Phaser registry")

    // 移动端事件处理
    this.setupMobileEvents()
  }

  private setupMobileEvents() {
    // 防止移动端双击缩放
    let lastTouchEnd = 0
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)

    // 防止移动端滚动
    document.addEventListener('touchmove', (event) => {
      if (event.target === this.container) {
        event.preventDefault()
      }
    }, { passive: false })

    // 处理屏幕旋转
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (this.phaserGame) {
          this.phaserGame.scale.resize(window.innerWidth, window.innerHeight)
        }
      }, 100)
    })

    // 处理窗口大小变化
    window.addEventListener('resize', () => {
      if (this.phaserGame) {
        this.phaserGame.scale.resize(window.innerWidth, window.innerHeight)
      }
    })
  }

  startARMode() {
    console.log("Starting AR mode...")
    // Switch to AR scene
    this.switchToARScene()
  }

  private switchToARScene() {
    // Implementation for AR scene switching
    if (this.phaserGame) {
      this.gameState.setCurrentMode("ar")
      this.phaserGame.scene.start("ARScene")
    }
  }

  private switchToMapScene() {
    // Implementation for map scene switching
    if (this.phaserGame) {
      this.gameState.setCurrentMode("map")
      this.phaserGame.scene.start("MapScene")
    }
  }

  private switchToBackpackScene() {
    console.log("switchToBackpackScene called!")
    if (this.phaserGame) {
      console.log("Switching to BackpackScene...")
      this.gameState.setCurrentMode("backpack")
      this.phaserGame.scene.start("BackpackScene")
      console.log("Scene switch command sent")
    } else {
      console.error("phaserGame is not initialized!")
    }
  }

  getGameState() {
    return this.gameState
  }

  destroy(removeCanvas = false) {
    if (this.phaserGame) {
      this.phaserGame.destroy(removeCanvas)
    }
  }
}
