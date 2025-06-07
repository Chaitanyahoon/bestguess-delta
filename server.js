const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const dotenv = require("dotenv")
const { v4: uuidv4 } = require("uuid")
const SpotifyWebApi = require("spotify-web-api-node")

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Configure CORS
app.use(
  cors({
    origin: "*", // In production, you should restrict this to your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  }),
)

app.use(express.json())

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000, // Increase ping timeout to 60 seconds
  pingInterval: 25000, // Check connection every 25 seconds
})

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

// Refresh Spotify access token
async function refreshSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant()
    spotifyApi.setAccessToken(data.body.access_token)
    console.log("Spotify access token refreshed")

    // Schedule next refresh before token expires
    setTimeout(refreshSpotifyToken, (data.body.expires_in - 60) * 1000)
  } catch (error) {
    console.error("Error refreshing Spotify token:", error)
    // Retry after 1 minute
    setTimeout(refreshSpotifyToken, 60000)
  }
}

// Game state
const rooms = new Map()
const ROOM_CODE_LENGTH = 6

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: Date.now(),
    rooms: rooms.size,
    players: Array.from(rooms.values()).reduce((count, room) => count + room.players.length, 0),
  })
})

// Root endpoint for CORS testing
app.get("/", (req, res) => {
  res.json({ message: "BeatMatch API is running" })
})

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Simple ping-pong for connection testing
  socket.on("ping", () => {
    console.log(`Ping from ${socket.id}`)
    socket.emit("pong")
  })

  // Join room
  socket.on("join-room", async ({ roomId, playerName, isHost }) => {
    console.log(`Join room request: ${roomId}, ${playerName}, host: ${isHost}`)

    if (!roomId || !playerName) {
      return socket.emit("room-error", { message: "Room ID and player name are required" })
    }

    // Normalize inputs
    roomId = roomId.toUpperCase()
    playerName = playerName.trim()

    // Validate inputs
    if (roomId.length !== ROOM_CODE_LENGTH) {
      return socket.emit("room-error", { message: "Invalid room code format" })
    }

    if (playerName.length > 20) {
      return socket.emit("room-error", { message: "Player name too long (max 20 characters)" })
    }

    // Create room if it doesn't exist and user is host
    if (!rooms.has(roomId)) {
      if (!isHost) {
        return socket.emit("room-error", { message: "Room does not exist" })
      }

      // Create new room
      rooms.set(roomId, {
        id: roomId,
        players: [],
        gameStarted: false,
        currentRound: 0,
        totalRounds: 5,
        questions: [],
        hostId: socket.id,
      })

      console.log(`Created new room: ${roomId}`)
    }

    const room = rooms.get(roomId)

    // Check if game already started
    if (room.gameStarted && !room.players.some((p) => p.name === playerName)) {
      return socket.emit("room-error", { message: "Game already in progress" })
    }

    // Check if player name is taken
    if (room.players.some((p) => p.name === playerName && p.id !== socket.id)) {
      return socket.emit("room-error", { message: "Player name already taken" })
    }

    // Add player to room or update existing player
    const existingPlayerIndex = room.players.findIndex((p) => p.name === playerName)

    if (existingPlayerIndex >= 0) {
      // Update existing player
      room.players[existingPlayerIndex] = {
        ...room.players[existingPlayerIndex],
        id: socket.id,
        connected: true,
      }
    } else {
      // Add new player
      room.players.push({
        id: socket.id,
        name: playerName,
        score: 0,
        correctAnswers: 0,
        isHost: isHost,
        connected: true,
      })
    }

    // Join socket room
    socket.join(roomId)

    // Store room info in socket for disconnect handling
    socket.data.roomId = roomId
    socket.data.playerName = playerName

    // Notify all clients in the room
    io.to(roomId).emit("room-updated", {
      roomId,
      players: room.players,
      gameStarted: room.gameStarted,
    })

    console.log(`Player ${playerName} joined room ${roomId}`)
  })

  // Start game
  socket.on("start-game", async ({ roomId }) => {
    console.log(`Start game request for room ${roomId}`)

    if (!roomId || !rooms.has(roomId)) {
      return socket.emit("room-error", { message: "Room not found" })
    }

    const room = rooms.get(roomId)

    // Check if sender is host
    const player = room.players.find((p) => p.id === socket.id)
    if (!player || !player.isHost) {
      return socket.emit("room-error", { message: "Only the host can start the game" })
    }

    // Check minimum players
    if (room.players.length < 2) {
      return socket.emit("room-error", { message: "Need at least 2 players to start" })
    }

    try {
      // Generate questions
      room.questions = await generateQuestions(5)
      room.gameStarted = true
      room.currentRound = 1

      // Notify all clients that game is starting
      io.to(roomId).emit("game-started")

      // Start first round after a short delay
      setTimeout(() => {
        startRound(roomId)
      }, 3000)

      console.log(`Game started in room ${roomId}`)
    } catch (error) {
      console.error("Error starting game:", error)
      socket.emit("room-error", { message: "Failed to start game. Please try again." })
    }
  })

  // Submit answer
  socket.on("submit-answer", ({ roomId, playerName, answer }) => {
    console.log(`Answer submission: ${roomId}, ${playerName}, answer: ${answer}`)

    if (!roomId || !rooms.has(roomId)) {
      return socket.emit("room-error", { message: "Room not found" })
    }

    const room = rooms.get(roomId)

    if (!room.gameStarted) {
      return socket.emit("room-error", { message: "Game has not started" })
    }

    const currentQuestion = room.questions[room.currentRound - 1]
    if (!currentQuestion) {
      return socket.emit("room-error", { message: "No active question" })
    }

    // Find player
    const playerIndex = room.players.findIndex((p) => p.name === playerName)
    if (playerIndex === -1) {
      return socket.emit("room-error", { message: "Player not found" })
    }

    // Record answer if not already answered
    if (!room.players[playerIndex].hasAnswered) {
      const isCorrect = answer === currentQuestion.correctAnswer
      const timeLeft = room.timeLeft || 0
      const points = isCorrect ? calculatePoints(timeLeft) : 0

      room.players[playerIndex].hasAnswered = true

      if (isCorrect) {
        room.players[playerIndex].score += points
        room.players[playerIndex].correctAnswers += 1
      }

      // Notify player of their result
      socket.emit("answer-result", {
        correct: isCorrect,
        points,
        timeLeft,
      })

      console.log(`Player ${playerName} answered ${isCorrect ? "correctly" : "incorrectly"}`)

      // Check if all players have answered
      const allAnswered = room.players.every((p) => p.hasAnswered)
      if (allAnswered) {
        clearTimeout(room.roundTimer)
        endRound(roomId)
      }
    }
  })

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`)

    const roomId = socket.data.roomId
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId)

      // Mark player as disconnected
      const playerIndex = room.players.findIndex((p) => p.id === socket.id)
      if (playerIndex !== -1) {
        const player = room.players[playerIndex]
        console.log(`Player ${player.name} disconnected from room ${roomId}`)

        // If game hasn't started, remove the player
        if (!room.gameStarted) {
          room.players.splice(playerIndex, 1)
        } else {
          // Otherwise mark as disconnected
          player.connected = false
        }

        // If host disconnected, assign a new host
        if (player.isHost && room.players.length > 0) {
          const newHost = room.players.find((p) => p.connected)
          if (newHost) {
            newHost.isHost = true
            room.hostId = newHost.id
          }
        }

        // If room is empty, remove it
        if (room.players.length === 0 || room.players.every((p) => !p.connected)) {
          console.log(`Removing empty room: ${roomId}`)
          rooms.delete(roomId)
        } else {
          // Notify remaining players
          io.to(roomId).emit("room-updated", {
            roomId,
            players: room.players,
            gameStarted: room.gameStarted,
          })
        }
      }
    }
  })
})

// Helper functions
async function generateQuestions(count) {
  try {
    // Make sure we have a valid token
    if (!spotifyApi.getAccessToken()) {
      await refreshSpotifyToken()
    }

    // Get some popular tracks
    const response = await spotifyApi.getPlaylistTracks({
      playlistId: "37i9dQZEVXbMDoHDwVN2tF", // Global Top 50
      limit: 50,
    })

    const tracks = response.body.items
      .filter((item) => item.track && item.track.preview_url) // Only tracks with preview URLs
      .map((item) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists[0].name,
        audioUrl: item.track.preview_url,
      }))

    if (tracks.length < count) {
      throw new Error("Not enough tracks with preview URLs")
    }

    // Shuffle and pick random tracks
    const shuffled = tracks.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, count)

    // For each selected track, get 3 more random tracks for options
    const questions = await Promise.all(
      selected.map(async (track) => {
        // Get other tracks for options
        const otherTracks = shuffled.filter((t) => t.id !== track.id).slice(0, 3)

        // Create options array with correct answer
        const options = [`${track.name} - ${track.artist}`, ...otherTracks.map((t) => `${t.name} - ${t.artist}`)]

        // Shuffle options
        const shuffledOptions = options.sort(() => 0.5 - Math.random())

        // Find index of correct answer
        const correctAnswer = shuffledOptions.findIndex((option) => option === `${track.name} - ${track.artist}`)

        return {
          id: track.id,
          audioUrl: track.audioUrl,
          options: shuffledOptions,
          correctAnswer,
          artist: track.artist,
        }
      }),
    )

    return questions
  } catch (error) {
    console.error("Error generating questions:", error)

    // Fallback to mock questions if Spotify API fails
    return generateMockQuestions(count)
  }
}

function generateMockQuestions(count) {
  const mockSongs = [
    {
      name: "Bohemian Rhapsody",
      artist: "Queen",
      url: "https://p.scdn.co/mp3-preview/5a12483aa3b51331aba1fbe5f59ecf4af5d9290b",
    },
    {
      name: "Billie Jean",
      artist: "Michael Jackson",
      url: "https://p.scdn.co/mp3-preview/f504e6b8e037771318656394f532dede4f9bcaea",
    },
    {
      name: "Smells Like Teen Spirit",
      artist: "Nirvana",
      url: "https://p.scdn.co/mp3-preview/5a12483aa3b51331aba1fbe5f59ecf4af5d9290b",
    },
    {
      name: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      url: "https://p.scdn.co/mp3-preview/f504e6b8e037771318656394f532dede4f9bcaea",
    },
    {
      name: "Hotel California",
      artist: "Eagles",
      url: "https://p.scdn.co/mp3-preview/5a12483aa3b51331aba1fbe5f59ecf4af5d9290b",
    },
    {
      name: "Imagine",
      artist: "John Lennon",
      url: "https://p.scdn.co/mp3-preview/f504e6b8e037771318656394f532dede4f9bcaea",
    },
    {
      name: "Stairway to Heaven",
      artist: "Led Zeppelin",
      url: "https://p.scdn.co/mp3-preview/5a12483aa3b51331aba1fbe5f59ecf4af5d9290b",
    },
    {
      name: "Yesterday",
      artist: "The Beatles",
      url: "https://p.scdn.co/mp3-preview/f504e6b8e037771318656394f532dede4f9bcaea",
    },
    {
      name: "Like a Rolling Stone",
      artist: "Bob Dylan",
      url: "https://p.scdn.co/mp3-preview/5a12483aa3b51331aba1fbe5f59ecf4af5d9290b",
    },
    {
      name: "Purple Haze",
      artist: "Jimi Hendrix",
      url: "https://p.scdn.co/mp3-preview/f504e6b8e037771318656394f532dede4f9bcaea",
    },
  ]

  const questions = []

  for (let i = 0; i < count; i++) {
    const correctIndex = i % mockSongs.length
    const correctSong = mockSongs[correctIndex]

    // Get 3 other random songs for options
    const otherOptions = []
    for (let j = 1; j <= 3; j++) {
      const index = (correctIndex + j) % mockSongs.length
      otherOptions.push(`${mockSongs[index].name} - ${mockSongs[index].artist}`)
    }

    // Create options array with correct answer
    const options = [`${correctSong.name} - ${correctSong.artist}`, ...otherOptions]

    // Shuffle options
    const shuffledOptions = options.sort(() => 0.5 - Math.random())

    // Find index of correct answer
    const correctAnswer = shuffledOptions.findIndex(
      (option) => option === `${correctSong.name} - ${correctSong.artist}`,
    )

    questions.push({
      id: `mock-${i}`,
      audioUrl: correctSong.url,
      options: shuffledOptions,
      correctAnswer,
      artist: correctSong.artist,
    })
  }

  return questions
}

function calculatePoints(timeLeft) {
  // Base points + bonus for answering quickly
  return 100 + Math.floor(timeLeft * 3.33)
}

function startRound(roomId) {
  if (!rooms.has(roomId)) return

  const room = rooms.get(roomId)
  const question = room.questions[room.currentRound - 1]

  if (!question) return

  // Reset player answers
  room.players.forEach((player) => {
    player.hasAnswered = false
  })

  // Set round timer
  room.timeLeft = 30 // 30 seconds per round

  // Send question to all players
  io.to(roomId).emit("new-question", {
    round: room.currentRound,
    question: {
      id: question.id,
      audioUrl: question.audioUrl,
      options: question.options,
      correctAnswer: null, // Don't send correct answer yet
      artist: null, // Don't send artist yet
    },
  })

  // Start countdown
  const timerInterval = setInterval(() => {
    if (!rooms.has(roomId)) {
      clearInterval(timerInterval)
      return
    }

    room.timeLeft--
    io.to(roomId).emit("timer-update", room.timeLeft)

    if (room.timeLeft <= 0) {
      clearInterval(timerInterval)
      endRound(roomId)
    }
  }, 1000)

  // Store timer reference for cleanup
  room.roundTimer = timerInterval

  console.log(`Round ${room.currentRound} started in room ${roomId}`)
}

function endRound(roomId) {
  if (!rooms.has(roomId)) return

  const room = rooms.get(roomId)
  const question = room.questions[room.currentRound - 1]

  if (!question) return

  // Send round results with correct answer
  io.to(roomId).emit("round-results", {
    correctAnswer: question.correctAnswer,
    correctSong: question.options[question.correctAnswer],
    artist: question.artist,
    players: room.players,
  })

  console.log(`Round ${room.currentRound} ended in room ${roomId}`)

  // Check if game is over
  if (room.currentRound >= room.totalRounds) {
    // End game after showing results
    setTimeout(() => {
      io.to(roomId).emit("game-ended", {
        players: room.players,
      })

      // Reset game state but keep players
      room.gameStarted = false
      room.currentRound = 0
      room.questions = []
      room.players.forEach((player) => {
        player.score = 0
        player.correctAnswers = 0
        player.hasAnswered = false
      })

      console.log(`Game ended in room ${roomId}`)
    }, 5000)
  } else {
    // Start next round after showing results
    setTimeout(() => {
      room.currentRound++
      startRound(roomId)
    }, 5000)
  }
}

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  refreshSpotifyToken()
})
