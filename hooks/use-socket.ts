"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connectionAttempts: number
}

export function useSocket() {
  const [state, setState] = useState<SocketState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    connectionAttempts: 0,
  })

  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://beatmatch-jbss.onrender.com"

  const updateState = useCallback((updates: Partial<SocketState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const createConnection = useCallback(() => {
    // Don't create multiple connections
    if (socketRef.current?.connected) {
      console.log("Socket already connected, skipping creation")
      return socketRef.current
    }

    // Clean up existing socket
    if (socketRef.current) {
      console.log("Cleaning up existing socket")
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }

    console.log(`🔌 Creating new socket connection to ${socketUrl}`)
    updateState({ isConnecting: true, error: null })

    try {
      const socketInstance = io(socketUrl, {
        transports: ["websocket", "polling"],
        timeout: 30000, // Increase timeout
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10, // Increase attempts
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
        withCredentials: false,
      })

      socketRef.current = socketInstance

      // Connection successful
      socketInstance.on("connect", () => {
        console.log("✅ Socket connected successfully:", socketInstance.id)
        updateState({
          socket: socketInstance,
          isConnected: true,
          isConnecting: false,
          error: null,
          connectionAttempts: 0,
        })

        // Test the connection immediately
        socketInstance.emit("ping")
        socketInstance.once("pong", () => {
          console.log("🏓 Connection test successful")
        })
      })

      // Connection failed
      socketInstance.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error)
        updateState({
          isConnected: false,
          isConnecting: false,
          error: `Connection failed: ${error.message || error}`,
          connectionAttempts: (prev) => prev + 1,
        })
      })

      // Disconnected
      socketInstance.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason)
        updateState({
          isConnected: false,
          isConnecting: false,
          error: `Disconnected: ${reason}`,
        })

        // Auto-reconnect for certain disconnect reasons
        if (reason === "io server disconnect" || reason === "transport close") {
          console.log("🔄 Attempting auto-reconnect...")
          reconnectTimeoutRef.current = setTimeout(() => {
            createConnection()
          }, 2000)
        }
      })

      return socketInstance
    } catch (err) {
      console.error("Failed to create socket:", err)
      updateState({
        isConnecting: false,
        error: `Failed to initialize connection: ${err}`,
      })
      return null
    }
  }, [socketUrl, updateState])

  const reconnect = useCallback(() => {
    console.log("🔄 Manual reconnection requested")

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Reset state
    updateState({
      isConnected: false,
      isConnecting: true,
      error: null,
    })

    // Create new connection
    setTimeout(() => {
      createConnection()
    }, 1000)
  }, [createConnection, updateState])

  const waitForConnection = useCallback(
    (timeout = 15000): Promise<Socket> => {
      return new Promise((resolve, reject) => {
        // If already connected, return immediately
        if (state.isConnected && state.socket) {
          resolve(state.socket)
          return
        }

        // If not connecting, start connection
        if (!state.isConnecting) {
          createConnection()
        }

        const timeoutId = setTimeout(() => {
          reject(new Error(`Connection timeout after ${timeout}ms`))
        }, timeout)

        const checkConnection = () => {
          if (state.isConnected && state.socket) {
            clearTimeout(timeoutId)
            resolve(state.socket)
          } else if (state.error && !state.isConnecting) {
            clearTimeout(timeoutId)
            reject(new Error(state.error))
          } else {
            setTimeout(checkConnection, 100)
          }
        }

        checkConnection()
      })
    },
    [state.isConnected, state.socket, state.isConnecting, state.error, createConnection],
  )

  // Initialize connection on mount
  useEffect(() => {
    createConnection()

    return () => {
      console.log("🔌 Cleaning up socket connection...")

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [createConnection])

  return {
    socket: state.socket,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    connectionAttempts: state.connectionAttempts,
    reconnect,
    waitForConnection,
  }
}
