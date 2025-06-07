"use client"

import { useEffect, useState, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) {
      return
    }

    console.log("🔌 Initializing socket connection to https://beatmatch-jbss.onrender.com")

    try {
      const socketInstance = io("https://beatmatch-jbss.onrender.com", {
        transports: ["websocket", "polling"],
        timeout: 30000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
        withCredentials: false, // Important for CORS
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
  }, [])

  return { socket, isConnected, error }
}
