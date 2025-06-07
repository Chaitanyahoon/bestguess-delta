// Simple test script to verify the server is working
const { io } = require("socket.io-client")

const socket = io("http://localhost:3001", {
  transports: ["websocket", "polling"],
})

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id)

  // Test ping
  socket.emit("ping")
})

socket.on("pong", () => {
  console.log("Received pong from server")

  // Test joining a room
  socket.emit("join-room", {
    roomId: "TEST01",
    playerName: "TestPlayer",
    isHost: true,
  })
})

socket.on("room-updated", (data) => {
  console.log("Room updated:", data)
  console.log("Test successful!")
  socket.disconnect()
})

socket.on("room-error", (error) => {
  console.error("Room error:", error)
  socket.disconnect()
})

socket.on("connect_error", (error) => {
  console.error("Connection error:", error)
})

socket.on("disconnect", () => {
  console.log("Disconnected from server")
})

console.log("Running test script...")
