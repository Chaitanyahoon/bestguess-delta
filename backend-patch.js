// Add this to your backend server.js file in the socket.io connection handler

const server = require("http").createServer() // Declare the server variable
const io = require("socket.io")(server) // Assuming server is already defined
const rooms = new Map() // Declare the rooms variable

io.on("connection", (socket) => {
  console.log("A user connected")

  // Get room state (add this event handler)
  socket.on("get-room-state", ({ roomId }) => {
    console.log(`Get room state request: ${roomId}`)

    if (!roomId || !rooms.has(roomId)) {
      return socket.emit("room-error", { message: "Room not found" })
    }

    const room = rooms.get(roomId)

    // Send current room state
    socket.emit("room-updated", {
      roomId,
      players: room.players,
      gameStarted: room.gameStarted,
    })

    console.log(`Sent room state for ${roomId}: ${room.players.length} players`)
  })

  // ** rest of code here **
})

server.listen(3000, () => {
  console.log("Server is running on port 3000")
})
