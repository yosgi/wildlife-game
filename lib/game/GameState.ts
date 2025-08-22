export interface Animal {
  id: string
  name: string
  species: string
  region: "north" | "south" | "both"
  habitat: string
  diet: string[]
  conservationStatus: string
  description: string
  intimacyLevel: number
  captured: boolean
  lastFed?: Date
}

export interface GameProgress {
  animalsDiscovered: string[]
  totalAnimals: number
  currentRegion: "north" | "south" | null
  backpackItems: string[]
  achievements: string[]
}

export class GameState {
  private animals: Map<string, Animal> = new Map()
  private progress: GameProgress
  private currentMode: "map" | "ar" | "backpack" = "map"

  constructor() {
    this.progress = {
      animalsDiscovered: [],
      totalAnimals: 0,
      currentRegion: null,
      backpackItems: [],
      achievements: [],
    }

    this.initializeAnimals()
  }

  private initializeAnimals() {
    // New Zealand native animals data
    const nzAnimals: Omit<Animal, "intimacyLevel" | "captured">[] = [
      {
        id: "kiwi",
        name: "Kiwi",
        species: "Apteryx",
        region: "both",
        habitat: "Forest",
        diet: ["Insects", "Worms", "Berries"],
        conservationStatus: "Endangered",
        description: "New Zealand's national bird, nocturnal and flightless",
      },
      {
        id: "kakapo",
        name: "Kakapo",
        species: "Strigops habroptilus",
        region: "south",
        habitat: "Mountain forest",
        diet: ["Leaves", "Flowers", "Fruits"],
        conservationStatus: "Critically Endangered",
        description: "The world's only flightless parrot",
      },
      {
        id: "tuatara",
        name: "Tuatara",
        species: "Sphenodon punctatus",
        region: "north",
        habitat: "Islands",
        diet: ["Insects", "Small reptiles"],
        conservationStatus: "Vulnerable",
        description: "Living fossil, existed for 200 million years",
      },
      {
        id: "yellow-eyed-penguin",
        name: "Yellow-eyed Penguin",
        species: "Megadyptes antipodes",
        region: "south",
        habitat: "Coast",
        diet: ["Fish", "Squid"],
        conservationStatus: "Endangered",
        description: "One of the world's rarest penguins",
      },
    ] as Animal[]

    nzAnimals.forEach((animal) => {
      this.animals.set(animal.id, {
        ...animal,
        intimacyLevel: 0,
        captured: false,
      })
    })

    this.progress.totalAnimals = this.animals.size
  }

  getAnimal(id: string): Animal | undefined {
    return this.animals.get(id)
  }

  getAllAnimals(): Animal[] {
    return Array.from(this.animals.values())
  }

  getAnimalsByRegion(region: "north" | "south"): Animal[] {
    return Array.from(this.animals.values()).filter((animal) => animal.region === region || animal.region === "both")
  }

  captureAnimal(animalId: string): boolean {
    const animal = this.animals.get(animalId)
    if (animal && !animal.captured) {
      animal.captured = true
      animal.intimacyLevel = 1
      this.progress.animalsDiscovered.push(animalId)
      return true
    }
    return false
  }

  feedAnimal(animalId: string, food: string): boolean {
    const animal = this.animals.get(animalId)
    if (animal && animal.captured && animal.diet.includes(food)) {
      animal.intimacyLevel = Math.min(animal.intimacyLevel + 1, 10)
      animal.lastFed = new Date()
      return true
    }
    return false
  }

  setCurrentRegion(region: "north" | "south" | null) {
    this.progress.currentRegion = region
  }

  getCurrentRegion() {
    return this.progress.currentRegion
  }

  setCurrentMode(mode: "map" | "ar" | "backpack") {
    this.currentMode = mode
  }

  getCurrentMode() {
    return this.currentMode
  }

  showBackpack() {
    this.setCurrentMode("backpack")
    // Trigger backpack UI display
    const event = new CustomEvent("showBackpack", {
      detail: { animals: this.getCapturedAnimals() },
    })
    window.dispatchEvent(event)
  }

  getCapturedAnimals(): Animal[] {
    return Array.from(this.animals.values()).filter((animal) => animal.captured)
  }

  getProgress(): GameProgress {
    return { ...this.progress }
  }

  // Save/Load functionality for persistence
  saveGame(): string {
    const saveData = {
      animals: Array.from(this.animals.entries()),
      progress: this.progress,
      currentMode: this.currentMode,
    }
    return JSON.stringify(saveData)
  }

  loadGame(saveData: string): boolean {
    try {
      const data = JSON.parse(saveData)
      this.animals = new Map(data.animals)
      this.progress = data.progress
      this.currentMode = data.currentMode
      return true
    } catch (error) {
      console.error("Failed to load game:", error)
      return false
    }
  }
}
