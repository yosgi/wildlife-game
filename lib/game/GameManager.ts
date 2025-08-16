import { GameState } from "./GameState"
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

    // Set up event listeners
    this.setupEventListeners()
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
      scene: [MapScene, ARScene, BackpackScene],
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
      },
    }

    this.phaserGame = new Phaser.Game(config)
    this.phaserGame.gameManager = this
  }

  private setupEventListeners() {
    // Handle window resize
    window.addEventListener("resize", () => {
      if (this.phaserGame) {
        this.phaserGame.scale.resize(window.innerWidth, window.innerHeight)
      }
    })

    // Handle UI button clicks
    this.setupUIHandlers()

    window.addEventListener("showBackpack", (event: any) => {
      this.switchToBackpackScene()
    })
  }

  private setupUIHandlers() {
    // AR exploration button
    const arButton = document.querySelector('[data-action="explore-ar"]')
    if (arButton) {
      arButton.addEventListener("click", () => this.startARMode())
    }

    // Map button
    const mapButton = document.querySelector('[data-action="map"]')
    if (mapButton) {
      mapButton.addEventListener("click", () => this.showMap())
    }

    // Backpack button
    const backpackButton = document.querySelector('[data-action="backpack"]')
    if (backpackButton) {
      backpackButton.addEventListener("click", () => this.showBackpack())
    }
  }

  startARMode() {
    console.log("Starting AR mode...")
    // Switch to AR scene
    this.switchToARScene()
  }

  showMap() {
    console.log("Showing map...")
    // Switch to map scene
    this.switchToMapScene()
  }

  showBackpack() {
    console.log("Showing backpack...")
    this.switchToBackpackScene()
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
    if (this.phaserGame) {
      this.gameState.setCurrentMode("backpack")
      this.phaserGame.scene.start("BackpackScene")
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
