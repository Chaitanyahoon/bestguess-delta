"use client"

import { useEffect, useState, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://beatmatch-jbss.onrender.com"

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) {
      console.log("Socket already exists, reusing existing connection")
      return
    }

    console.log(`🔌 Initializing socket connection to ${socketUrl}`)

    try {
      const socketInstance = io(socketUrl, {
        transports: ["websocket", "polling"],
        timeout: 30000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
        withCredentials: false, // Important for CORS
        query: {
          clientTime: new Date().toISOString(),
          clientId: `client-${Math.random().toString(36).substring(2, 9)}`,
        },
      })

      socketRef.current = socketInstance

      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance.id)
        setIsConnected(true)
        setError(null)
        setSocket(socketInstance)
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason)
        setIsConnected(false)
        if (reason === "io server disconnect") {
          // Server disconnected, try to reconnect
          socketInstance.connect()
        }
      })

      socketInstance.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error)
        setError(error.message)
        setIsConnected(false)
      })

      socketInstance.on("reconnect", (attemptNumber) => {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts")
        setIsConnected(true)
        setError(null)
      })

      socketInstance.on("reconnect_error", (error) => {
        console.error("🔄 Socket reconnection failed:", error)
        setError("Reconnection failed")
      })

      socketInstance.on("reconnect_failed", () => {
        console.error("💀 Socket reconnection failed permanently")
        setError("Connection failed permanently")
      })

      // Test connection with ping
      socketInstance.on("connect", () => {
        socketInstance.emit("ping")
        socketInstance.once("pong", () => {
          console.log("🏓 Ping successful")
        })
      })

      return () => {
        console.log("🔌 Cleaning up socket connection...")
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.disconnect()
          socketRef.current = null
        }
        setSocket(null)
        setIsConnected(false)
      }
    } catch (err) {
      console.error("Failed to initialize socket:", err)
      setError("Socket initialization failed")
      return () => {}
    }
  }, [socketUrl])

  // Expose a function to manually reconnect
  const reconnect = () => {
    console.log("🔄 Manual reconnection requested")
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current.connect()
    } else {
      // If socket doesn't exist, force a re-render to create a new one
      setSocket(null)
      socketRef.current = null
    }
  }

  return { socket, isConnected, error, reconnect }
}
