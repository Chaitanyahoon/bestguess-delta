"use client"

import { useEffect, useState, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const connectAttemptsRef = useRef(0)
  const maxConnectAttempts = 3

  const cleanup = () => {
    if (socketRef.current) {
      console.log("🧹 Cleaning up socket connection")
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setSocket(null)
    setIsConnected(false)
    setIsConnecting(false)
  }

  const testServerAvailability = async (): Promise<boolean> => {
    try {
      console.log("🔍 Testing server availability...")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch("https://beatmatch-jbss.onrender.com/health", {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        console.log("✅ Server is available")
        return true
      } else {
        console.log("❌ Server returned error:", response.status)
        return false
      }
    } catch (error) {
      console.log("❌ Server availability test failed:", error)
      return false
    }
  }

  const connectSocket = async () => {
    if (connectAttemptsRef.current >= maxConnectAttempts) {
      setError("Server appears to be offline. Please try again later.")
      setIsConnecting(false)
      return
    }

    if (socketRef.current) {
      cleanup()
    }

    connectAttemptsRef.current++
    setIsConnecting(true)
    setError(null)

    console.log(`🔌 Connection attempt ${connectAttemptsRef.current}/${maxConnectAttempts}`)

    // Test server availability first
    const serverAvailable = await testServerAvailability()
    if (!serverAvailable) {
      setError("Backend server is not responding. The server might be starting up or temporarily unavailable.")
      setIsConnecting(false)

      // Retry after a longer delay if server is not available
      if (connectAttemptsRef.current < maxConnectAttempts) {
        setTimeout(() => {
          connectSocket()
        }, 10000) // Wait 10 seconds before retrying
      }
      return
    }

    try {
      const socketInstance = io("https://beatmatch-jbss.onrender.com", {
        transports: ["polling"], // Use only polling to avoid websocket issues
        timeout: 15000,
        reconnection: false, // Disable automatic reconnection to handle it manually
        forceNew: true,
        withCredentials: false,
        autoConnect: true,
        upgrade: false, // Don't try to upgrade to websocket
      })

      socketRef.current = socketInstance

      // Set up event handlers
      socketInstance.on("connect", () => {
        console.log("✅ Socket connected successfully:", socketInstance.id)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        setSocket(socketInstance)
        connectAttemptsRef.current = 0 // Reset on successful connection
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason)
        setIsConnected(false)
        setSocket(null)

        // Don't automatically reconnect, let user decide
        if (reason !== "io client disconnect") {
          setError("Connection lost. Click reconnect to try again.")
        }
      })

      socketInstance.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err.message)
        setIsConnecting(false)
        setIsConnected(false)
        setSocket(null)

        if (err.message.includes("xhr poll error")) {
          setError("Connection failed. The server might be temporarily unavailable.")
        } else {
          setError(`Connection error: ${err.message}`)
        }

        // Retry with delay
        if (connectAttemptsRef.current < maxConnectAttempts) {
          setTimeout(() => {
            connectSocket()
          }, 5000)
        }
      })

      // Set a timeout for the connection attempt
      setTimeout(() => {
        if (!socketInstance.connected && socketRef.current === socketInstance) {
          console.log("⏰ Connection attempt timed out")
          socketInstance.disconnect()
          setError("Connection timed out. Please try again.")
          setIsConnecting(false)

          if (connectAttemptsRef.current < maxConnectAttempts) {
            setTimeout(() => {
              connectSocket()
            }, 3000)
          }
        }
      }, 20000)
    } catch (error) {
      console.error("❌ Failed to create socket:", error)
      setError("Failed to initialize connection")
      setIsConnecting(false)
    }
  }

  const reconnect = () => {
    console.log("🔄 Manual reconnect requested")
    connectAttemptsRef.current = 0
    cleanup()
    setError(null)
    setTimeout(connectSocket, 1000)
  }

  useEffect(() => {
    connectSocket()

    return cleanup
  }, [])

  return {
    socket,
    isConnected,
    error,
    isConnecting,
    reconnect,
  }
}
