import { renderHook } from "@testing-library/react"
import { useSocket } from "@/hooks/use-socket"
import { io } from "socket.io-client"
import jest from "jest"

jest.mock("socket.io-client")

describe("useSocket", () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
    connected: false,
    id: "test-id",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(io as jest.Mock).mockReturnValue(mockSocket)
  })

  it("initializes socket connection", () => {
    renderHook(() => useSocket())

    expect(io).toHaveBeenCalledWith(
      "https://beatmatch-jbss.onrender.com",
      expect.objectContaining({
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
      }),
    )
  })

  it("sets up event listeners", () => {
    renderHook(() => useSocket())

    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith("connect_error", expect.any(Function))
  })

  it("provides reconnect function", () => {
    const { result } = renderHook(() => useSocket())

    expect(typeof result.current.reconnect).toBe("function")
  })

  it("provides waitForConnection function", () => {
    const { result } = renderHook(() => useSocket())

    expect(typeof result.current.waitForConnection).toBe("function")
  })

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => useSocket())

    unmount()

    expect(mockSocket.removeAllListeners).toHaveBeenCalled()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })
})
