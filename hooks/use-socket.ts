"use client"

import { useEffect, useState, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) {
      return
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://beatmatch-jbss.onrender.com"
    console.log("🔌 Initializing socket connection to:", socketUrl)

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socketInstance

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id)
      setIsConnected(true)
      setError(null)
      setSocket(socketInstance)
      reconnectAttempts.current = 0
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
      reconnectAttempts.current++

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError("Failed to connect after multiple attempts")
      }
    })

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts")
      setIsConnected(true)
      setError(null)
      reconnectAttempts.current = 0
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
  }, [])

  return { socket, isConnected, error }
}
