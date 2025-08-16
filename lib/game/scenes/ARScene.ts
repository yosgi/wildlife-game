import Phaser from "phaser"
import { FeedingSystem } from "../systems/FeedingSystem"

export class ARScene extends Phaser.Scene {
  private arContainer?: HTMLDivElement
  private gameManager: any
  private arSystem?: any
  private currentAnimal?: any
  private feedingUI?: Phaser.GameObjects.Container
  private arInitialized = false
  private feedingSystem?: FeedingSystem

  constructor() {
    super({ key: "ARScene" })
  }

  create() {
    this.gameManager = this.game.gameManager
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

    const arIndicator = this.add.container(this.cameras.main.centerX, 50).setDepth(10)

    const indicatorBg = this.add.rectangle(0, 0, 200, 40, 0x000000, 0.8).setStroke(0x00ff00, 2)

    const indicatorText = this.add
      .text(0, 0, "AR 模式激活", {
        fontSize: "16px",
        color: "#00ff00",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    arIndicator.add([indicatorBg, indicatorText])

    this.tweens.add({
      targets: indicatorBg,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    })
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

      await this.loadAnimalModels()

      this.arInitialized = true
      this.showARInstructions()
    } catch (error) {
      console.error("AR initialization failed:", error)
      this.showARFallback()
    }
  }

  private async setupARJS() {
    const [THREE, THREEx] = await Promise.all([
      import("three"),
      import("@ar-js-org/ar.js/three.js/build/ar-threex-location-only"),
    ])

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    scene.add(camera)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setClearColor(new THREE.Color("lightgrey"), 0)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.top = "0px"
    renderer.domElement.style.left = "0px"
    this.arContainer?.appendChild(renderer.domElement)

    const arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: "webcam",
    })

    const arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl: "/camera_para.dat",
      detectionMode: "mono",
    })

    const markerControls = this.setupMarkerControls(THREE, THREEx, scene, camera)

    this.arSystem = {
      scene,
      camera,
      renderer,
      arToolkitSource,
      arToolkitContext,
      markerControls,
      THREE,
    }

    this.startARRenderLoop()
  }

  private setupMarkerControls(THREE: any, THREEx: any, scene: any, camera: any) {
    const region = this.gameManager.getGameState().getCurrentRegion()
    const animals = this.gameManager.getGameState().getAnimalsByRegion(region)
    const markerControls: any[] = []

    animals.forEach((animal, index) => {
      const markerRoot = new THREE.Group()
      scene.add(markerRoot)

      const markerControl = new THREEx.ArMarkerControls(this.arSystem?.arToolkitContext, markerRoot, {
        type: "pattern",
        patternUrl: `/markers/pattern-${animal.id}.patt`,
      })

      markerControls.push({
        animal,
        markerRoot,
        markerControl,
        detected: false,
      })
    })

    return markerControls
  }

  private async loadAnimalModels() {
    if (!this.arSystem) return

    const { THREE } = this.arSystem
    const loader = new THREE.GLTFLoader()

    const modelPromises = this.arSystem.markerControls.map(async (control: any) => {
      try {
        const gltf = await new Promise((resolve, reject) => {
          loader.load(`/models/${control.animal.id}.glb`, resolve, undefined, reject)
        })

        const model = (gltf as any).scene
        model.scale.set(0.5, 0.5, 0.5)
        model.position.set(0, 0, 0)

        if ((gltf as any).animations && (gltf as any).animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model)
          const action = mixer.clipAction((gltf as any).animations[0])
          action.play()
          control.mixer = mixer
        }

        control.markerRoot.add(model)
        control.model = model

        const interactionGeometry = new THREE.SphereGeometry(1, 16, 16)
        const interactionMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0,
        })
        const interactionSphere = new THREE.Mesh(interactionGeometry, interactionMaterial)
        interactionSphere.userData = { animal: control.animal, interactive: true }
        control.markerRoot.add(interactionSphere)
        control.interactionSphere = interactionSphere
      } catch (error) {
        console.error(`Failed to load model for ${control.animal.id}:`, error)
        this.createFallbackModel(control)
      }
    })

    await Promise.all(modelPromises)
  }

  private createFallbackModel(control: any) {
    if (!this.arSystem) return

    const { THREE } = this.arSystem

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({
      color: this.getAnimalColor(control.animal.id),
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(0, 0.5, 0)

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")!
    canvas.width = 256
    canvas.height = 128
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, 256, 128)
    context.fillStyle = "#000000"
    context.font = "24px Arial"
    context.textAlign = "center"
    context.fillText(control.animal.name, 128, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture })
    const textGeometry = new THREE.PlaneGeometry(2, 1)
    const textMesh = new THREE.Mesh(textGeometry, textMaterial)
    textMesh.position.set(0, 2, 0)

    control.markerRoot.add(cube)
    control.markerRoot.add(textMesh)
    control.model = cube
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

    const { scene, camera, renderer, arToolkitSource, arToolkitContext } = this.arSystem

    const animate = () => {
      requestAnimationFrame(animate)

      if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement)
      }

      this.arSystem.markerControls.forEach((control: any) => {
        if (control.mixer) {
          control.mixer.update(0.016) // 60fps
        }

        if (control.markerRoot.visible && !control.detected) {
          control.detected = true
          this.onAnimalDetected(control.animal)
        } else if (!control.markerRoot.visible && control.detected) {
          control.detected = false
          this.onAnimalLost(control.animal)
        }
      })

      renderer.render(scene, camera)
    }

    animate()
  }

  private createARControls() {
    const backButton = this.add.container(60, 60).setDepth(20).setInteractive({ useHandCursor: true })

    const backBg = this.add.rectangle(0, 0, 100, 40, 0x000000, 0.8).setStroke(0xffffff, 2)

    const backText = this.add
      .text(0, 0, "← 返回", {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    backButton.add([backBg, backText])
    backButton.on("pointerdown", () => {
      this.exitARMode()
    })

    const statusContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.height - 100).setDepth(20)

    const statusBg = this.add.rectangle(0, 0, 300, 60, 0x000000, 0.8).setStroke(0x00ff00, 2)

    const statusText = this.add
      .text(0, -10, "寻找动物标记...", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const instructionText = this.add
      .text(0, 10, "将摄像头对准动物标记", {
        fontSize: "12px",
        color: "#cccccc",
      })
      .setOrigin(0.5)

    statusContainer.add([statusBg, statusText, instructionText])

    this.data.set("statusText", statusText)
    this.data.set("instructionText", instructionText)
  }

  private showARInstructions() {
    const region = this.gameManager.getGameState().getCurrentRegion()
    const regionText = region === "north" ? "北岛" : "南岛"
    const animals = this.gameManager.getGameState().getAnimalsByRegion(region)

    const instructionContainer = this.add.container(this.cameras.main.centerX, 150).setDepth(15)

    const instructionBg = this.add.rectangle(0, 0, 350, 120, 0x000000, 0.9).setStroke(0x00ff00, 2)

    const titleText = this.add
      .text(0, -40, `${regionText}动物探索`, {
        fontSize: "18px",
        color: "#00ff00",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const animalList = animals.map((a) => a.name).join("、")
    const contentText = this.add
      .text(0, -10, `可发现动物：${animalList}`, {
        fontSize: "14px",
        color: "#ffffff",
        wordWrap: { width: 320 },
        align: "center",
      })
      .setOrigin(0.5)

    const tipText = this.add
      .text(0, 20, "提示：确保光线充足，慢慢移动设备", {
        fontSize: "12px",
        color: "#cccccc",
      })
      .setOrigin(0.5)

    instructionContainer.add([instructionBg, titleText, contentText, tipText])

    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: instructionContainer,
        alpha: 0,
        duration: 1000,
        onComplete: () => instructionContainer.destroy(),
      })
    })
  }

  private showARFallback() {
    const fallbackContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(20)

    const fallbackBg = this.add.rectangle(0, 0, 300, 150, 0x000000, 0.9).setStroke(0xff0000, 2)

    const titleText = this.add
      .text(0, -50, "AR 不可用", {
        fontSize: "20px",
        color: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const messageText = this.add
      .text(0, -10, "您的设备不支持AR功能\n或摄像头访问被拒绝", {
        fontSize: "14px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)

    const simulateButton = this.add
      .text(0, 30, "模拟模式", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#4CAF50",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    simulateButton.on("pointerdown", () => {
      fallbackContainer.destroy()
      this.startSimulationMode()
    })

    fallbackContainer.add([fallbackBg, titleText, messageText, simulateButton])
  }

  private startSimulationMode() {
    const region = this.gameManager.getGameState().getCurrentRegion()
    const animals = this.gameManager.getGameState().getAnimalsByRegion(region)

    if (animals.length > 0) {
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)]

      this.time.delayedCall(2000, () => {
        this.simulateAnimalFound(randomAnimal)
      })
    }
  }

  private simulateAnimalFound(animal: any) {
    const animalContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(15)

    const animalBg = this.add.rectangle(0, 0, 250, 200, 0x000000, 0.8).setStroke(0x00ff00, 3)

    const animalImage = this.add.image(0, -30, `${animal.id}-icon`).setScale(1.5)

    const animalName = this.add
      .text(0, 40, animal.name, {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const feedButton = this.add
      .text(0, 70, "喂养", {
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

    animalContainer.add([animalBg, animalImage, animalName, feedButton])

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
      statusText.setText(`发现了 ${animal.name}！`)
      statusText.setColor("#00ff00")
    }

    if (instructionText) {
      instructionText.setText("点击动物进行互动")
    }

    this.showFeedingInterface(animal)
  }

  private onAnimalLost(animal: any) {
    console.log(`Animal lost: ${animal.name}`)

    const statusText = this.data.get("statusText")
    const instructionText = this.data.get("instructionText")

    if (statusText) {
      statusText.setText("寻找动物标记...")
      statusText.setColor("#ffffff")
    }

    if (instructionText) {
      instructionText.setText("将摄像头对准动物标记")
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
          `成功${food ? "喂养" : "捕获"} ${animal.name}！\n已添加到背包中`,
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
          food ? `${animal.name}不喜欢${food}` : "捕获失败",
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

    this.scene.start("MapScene")
  }

  update() {
    if (this.arInitialized && this.arSystem) {
      // AR updates are handled in the render loop
    }
  }
}
