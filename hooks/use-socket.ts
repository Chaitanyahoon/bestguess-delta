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

    console.log("🔌 Initializing socket connection...")

    // Try to connect with various options to bypass CORS
    const socketInstance = io("https://beatmatch-jbss.onrender.com", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      withCredentials: false,
      extraHeaders: {
        Origin: "https://beatmatch-delta.vercel.app",
      },
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
    })

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error)
      setError(`Connection failed: ${error.message}`)
      setIsConnected(false)
      reconnectAttempts.current++
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
