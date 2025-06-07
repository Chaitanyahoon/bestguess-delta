"use client"

import "@testing-library/jest-dom"
import { jest } from "@jest/globals"
import { beforeAll, afterAll } from "@jest/environment"

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useParams() {
    return {
      roomId: "TEST123",
    }
  },
  useSearchParams() {
    return new URLSearchParams("name=TestPlayer&host=true")
  },
  usePathname() {
    return "/test-path"
  },
}))

// Mock socket.io-client
jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: "test-socket-id",
  })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SOCKET_URL = "http://localhost:3001"

// Mock window.navigator
Object.defineProperty(window, "navigator", {
  value: {
    clipboard: {
      writeText: jest.fn(() => Promise.resolve()),
    },
    userAgent: "test-user-agent",
  },
  writable: true,
})

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    origin: "http://localhost:3000",
    href: "http://localhost:3000",
  },
  writable: true,
})

// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Warning: ReactDOM.render is no longer supported")) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
