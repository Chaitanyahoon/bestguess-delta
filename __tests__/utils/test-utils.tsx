import type React from "react"
import type { ReactElement } from "react"
import { render, type RenderOptions } from "@testing-library/react"
import { jest } from "@jest/globals"

// Mock providers if needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from "@testing-library/react"
export { customRender as render }

// Common test data
export const mockPlayer = {
  id: "player-1",
  name: "TestPlayer",
  score: 100,
  isHost: false,
  correctAnswers: 3,
}

export const mockRoom = {
  id: "TEST123",
  players: [mockPlayer],
  gameStarted: false,
}

export const mockQuestion = {
  id: "question-1",
  audioUrl: "https://example.com/audio.mp3",
  options: ["Song A", "Song B", "Song C", "Song D"],
  correctAnswer: 0,
  artist: "Test Artist",
}

// Helper functions
export const createMockSocket = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  removeAllListeners: jest.fn(),
  connected: true,
  id: "test-socket-id",
})

export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))
