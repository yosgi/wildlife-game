"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function GamePage() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Initialize game when component mounts
    if (typeof window !== "undefined" && gameContainerRef.current) {
      initializeGame()
    }

    return () => {
      // Cleanup game instance
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
      }
    }
  }, [])

  const initializeGame = async () => {
    // Dynamic import to avoid SSR issues
    const { GameManager } = await import("@/lib/game/GameManager")

    if (gameContainerRef.current) {
      gameInstanceRef.current = new GameManager(gameContainerRef.current)
      await gameInstanceRef.current.initialize()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400">
      {/* Game Container */}
      <div ref={gameContainerRef} id="game-container" className="w-full h-screen relative" />

      {/* Loading Screen */}
      <div id="loading-screen" className="absolute inset-0 bg-background flex items-center justify-center z-50">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-primary">新西兰动物探险</h1>
          <p className="text-muted-foreground mb-6">加载中...</p>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
          </div>
        </Card>
      </div>

      {/* Game UI Overlay */}
      <div id="game-ui" className="absolute inset-0 pointer-events-none z-40">
        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto">
          <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur">
            背包
          </Button>
          <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur">
            设置
          </Button>
        </div>

        {/* Bottom HUD */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-auto">
          <div className="flex gap-2">
            <Button className="bg-primary/90 backdrop-blur">探索AR</Button>
            <Button variant="outline" className="bg-background/80 backdrop-blur">
              地图
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
