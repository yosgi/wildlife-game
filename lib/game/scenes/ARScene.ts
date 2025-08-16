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

  constructor() {
    super({ key: "ARScene" })
  }

  create() {
    // Retrieve gameManager from scene data or another appropriate source
    const data = this.sys.settings.data as ARSceneData | undefined
    this.gameManager = data?.gameManager
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

    const indicatorBg = this.add.rectangle(0, 0, 200, 40, 0x000000, 0.8)
    const indicatorBorder = this.add.rectangle(0, 0, 200, 40).setStrokeStyle(2, 0x00ff00)

    const indicatorText = this.add
      .text(0, 0, "AR 模式激活", {
        fontSize: "16px",
        color: "#00ff00",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    arIndicator.add([indicatorBg, indicatorBorder, indicatorText])

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
    try {
      // 创建简化的AR环境，加载kakapo模型
      console.log("Setting up AR environment with kakapo model")
      
      // 使用动态导入避免TypeScript错误
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

      // 设置相机位置
      camera.position.z = 5

      // 加载kakapo模型
      await this.loadKakapoModel(scene, THREE)

      // 添加环境光和平行光
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
    } catch (error) {
      console.error("AR setup failed:", error)
      this.showARFallback()
    }
  }

  private async loadKakapoModel(scene: any, THREE: any) {
    try {
      // 正确导入OBJLoader
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

      // 调整模型大小和位置
      obj.scale.set(0.5, 0.5, 0.5)
      obj.position.set(0, -1, 0)
      obj.rotation.y = Math.PI / 4

      scene.add(obj)

      console.log("Kakapo model loaded successfully")
    } catch (error) {
      console.error("Failed to load kakapo model:", error)
      // 如果加载失败，创建一个简单的几何体作为替代
      this.createFallbackKakapo(scene, THREE)
    }
  }

  private createFallbackKakapo(scene: any, THREE: any) {
    // 创建一个简单的kakapo形状作为替代
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x4a5d23,
      transparent: true,
      opacity: 0.8
    })
    const kakapo = new THREE.Mesh(geometry, material)
    
    kakapo.position.set(0, 0, 0)
    scene.add(kakapo)

    // 添加简单的动画
    this.tweens.add({
      targets: kakapo.rotation,
      y: Math.PI * 2,
      duration: 8000,
      repeat: -1,
      ease: "Linear"
    })
  }

  private setupMarkerControls(THREE: any, ARjsThree: any, scene: any, camera: any) {
    const region = this.gameManager.getGameState().getCurrentRegion()
    const markerControls: any[] = []

    interface Animal {
      id: string
      name: string
      [key: string]: any
    }

    interface MarkerControl {
      animal: Animal
      markerRoot: THREE.Group
      markerControl: any
      detected: boolean
      mixer?: any
      model?: any
      interactionSphere?: any
    }

    const animals: Animal[] = this.gameManager.getGameState().getAnimalsByRegion(region)

    animals.forEach((animal: Animal, index: number) => {
      const markerRoot: any = new this.arSystem.THREE.Group()
      scene.add(markerRoot)

      const markerControl: any = new ARjsThree.ArMarkerControls(this.arSystem?.arToolkitContext, markerRoot, {
        type: "pattern",
        patternUrl: `/markers/pattern-${animal.id}.patt`,
      })

      markerControls.push({
        animal,
        markerRoot,
        markerControl,
        detected: false,
      } as MarkerControl)
    })

    return markerControls
  }

  private async loadAnimalModels() {
    if (!this.arSystem) return

    const { THREE } = this.arSystem
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
    const loader = new GLTFLoader()

    const modelPromises = this.arSystem.markerControls.map(async (control: any) => {
      try {
        const gltf = await new Promise((resolve, reject) => {
          (loader as any).load(`/models/${control.animal.id}.glb`, resolve, undefined, reject)
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

    const { scene, camera, renderer } = this.arSystem

    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    animate()
  }

  private createARControls() {
    const backButton = this.add.container(60, 60).setDepth(20)
    
    const backBg = this.add.rectangle(0, 0, 100, 40, 0x000000, 0.8)
    const backBorder = this.add.rectangle(0, 0, 100, 40).setStrokeStyle(2, 0xffffff)

    const backText = this.add
      .text(0, 0, "← 返回", {
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
    // 不显示任何说明文字
  }

  private showARFallback() {
    const fallbackContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY).setDepth(20)

    const fallbackBg = this.add.rectangle(0, 0, 300, 150, 0x000000, 0.9)
    const fallbackBorder = this.add.rectangle(0, 0, 300, 150).setStrokeStyle(2, 0xff0000)

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

    fallbackContainer.add([fallbackBg, fallbackBorder, titleText, messageText, simulateButton])
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
