"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function GamePage() {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize game when component mounts
    if (typeof window !== "undefined" && gameContainerRef.current && !isInitialized) {
      initializeGame()
      setIsInitialized(true)
    }

    return () => {
      // Cleanup game instance
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
        gameInstanceRef.current = null
      }
    }
  }, [isInitialized])

  const initializeGame = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { GameManager } = await import("@/lib/game/GameManager")

      if (gameContainerRef.current && !gameInstanceRef.current) {
        gameInstanceRef.current = new GameManager(gameContainerRef.current)
        await gameInstanceRef.current.initialize()
      }
    } catch (error) {
      console.error("Failed to initialize game:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400">
      {/* Game Container */}
      <div 
        ref={gameContainerRef} 
        id="game-container" 
        className="w-full h-screen relative touch-none select-none"
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      />

      {/* Loading Screen */}
      <div id="loading-screen" className="absolute inset-0 bg-background flex items-center justify-center z-50">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-primary">WildQuest</h1>
          <p className="text-muted-foreground mb-6">Loading...</p>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
          </div>
        </Card>
      </div>

      {/* Mobile-specific styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
          }
          
          #game-container {
            touch-action: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          #game-container canvas {
            touch-action: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        }
      `}</style>
    </div>
  )
}
