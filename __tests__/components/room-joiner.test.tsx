import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { RoomJoiner } from "@/components/room-joiner"
import jest from "jest" // Declare the jest variable

// Mock the useSocket hook
jest.mock("@/hooks/use-socket", () => ({
  useSocket: () => ({
    socket: {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      id: "test-socket-id",
    },
    isConnected: true,
    isConnecting: false,
    error: null,
    connectionAttempts: 0,
    reconnect: jest.fn(),
    waitForConnection: jest.fn(() =>
      Promise.resolve({
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        once: jest.fn(),
        id: "test-socket-id",
      }),
    ),
  }),
}))

describe("RoomJoiner", () => {
  const defaultProps = {
    roomId: "TEST123",
    playerName: "TestPlayer",
    isHost: false,
    onJoinSuccess: jest.fn(),
    onJoinError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders join button", () => {
    render(<RoomJoiner {...defaultProps} />)
    expect(screen.getByText("Join Room TEST123")).toBeInTheDocument()
  })

  it("shows ready to join status initially", () => {
    render(<RoomJoiner {...defaultProps} />)
    expect(screen.getByText("Ready to join")).toBeInTheDocument()
  })

  it("attempts to join when button clicked", async () => {
    render(<RoomJoiner {...defaultProps} />)

    const joinButton = screen.getByText("Join Room TEST123")
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText("Connecting to server...")).toBeInTheDocument()
    })
  })

  it("calls onJoinError when room ID is missing", async () => {
    const props = { ...defaultProps, roomId: "" }
    render(<RoomJoiner {...props} />)

    const joinButton = screen.getByText("Join Room ")
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(props.onJoinError).toHaveBeenCalledWith("Missing room ID or player name")
    })
  })

  it("shows retry button on error", async () => {
    const props = { ...defaultProps, roomId: "" }
    render(<RoomJoiner {...props} />)

    const joinButton = screen.getByText("Join Room ")
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument()
    })
  })
})
