# BeatMatch Backend

Backend server for the BeatMatch music guessing game.

## Setup

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Create a `.env` file with the following variables:
   \`\`\`
   PORT=3001
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   \`\`\`

3. Start the server:
   \`\`\`
   npm start
   \`\`\`

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository or use the "Deploy from Git Repository" option
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add the environment variables in the Render dashboard:
   - `PORT`: 3001 (or let Render assign one)
   - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /` - Root endpoint for CORS testing

## Socket.IO Events

### Client to Server
- `ping` - Test connection
- `join-room` - Join a game room
- `start-game` - Start the game (host only)
- `submit-answer` - Submit an answer for the current question

### Server to Client
- `pong` - Response to ping
- `room-updated` - Room state updated
- `room-error` - Error related to room operations
- `game-started` - Game has started
- `new-question` - New question for the round
- `timer-update` - Timer countdown update
- `answer-result` - Result of player's answer
- `round-results` - Results at the end of a round
- `game-ended` - Game has ended
\`\`\`

Let's also create a simple test script to verify the server is working:
