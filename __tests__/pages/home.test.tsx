import { render, screen, fireEvent } from "@testing-library/react"
import HomePage from "@/app/page"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock the router
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the main heading", () => {
    render(<HomePage />)
    expect(screen.getByText("BeatMatch")).toBeInTheDocument()
  })

  it("renders the tagline", () => {
    render(<HomePage />)
    expect(screen.getByText(/Guess the beat, match the rhythm, win the game!/)).toBeInTheDocument()
  })

  it("has player name input field", () => {
    render(<HomePage />)
    expect(screen.getByPlaceholderText("Your awesome name...")).toBeInTheDocument()
  })

  it("has create game button", () => {
    render(<HomePage />)
    expect(screen.getByText("Create New Game")).toBeInTheDocument()
  })

  it("disables create game button when no name entered", () => {
    render(<HomePage />)
    const createButton = screen.getByText("Create New Game")
    expect(createButton).toBeDisabled()
  })

  it("enables create game button when name is entered", () => {
    render(<HomePage />)
    const nameInput = screen.getByPlaceholderText("Your awesome name...")
    const createButton = screen.getByText("Create New Game")

    fireEvent.change(nameInput, { target: { value: "TestPlayer" } })
    expect(createButton).not.toBeDisabled()
  })

  it("creates game with valid name", () => {
    render(<HomePage />)
    const nameInput = screen.getByPlaceholderText("Your awesome name...")
    const createButton = screen.getByText("Create New Game")

    fireEvent.change(nameInput, { target: { value: "TestPlayer" } })
    fireEvent.click(createButton)

    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/room\/[A-Z0-9]{6}\?name=TestPlayer&host=true/))
  })

  it("shows join game section when join button clicked", () => {
    render(<HomePage />)
    const joinButton = screen.getByText("Join Game")

    fireEvent.click(joinButton)

    expect(screen.getByPlaceholderText("Enter room code...")).toBeInTheDocument()
  })

  it("validates room code length", () => {
    // Mock alert
    window.alert = jest.fn()

    render(<HomePage />)
    const nameInput = screen.getByPlaceholderText("Your awesome name...")
    const joinButton = screen.getByText("Join Game")

    fireEvent.change(nameInput, { target: { value: "TestPlayer" } })
    fireEvent.click(joinButton)

    const roomCodeInput = screen.getByPlaceholderText("Enter room code...")
    const joinNowButton = screen.getByText("Join Now")

    fireEvent.change(roomCodeInput, { target: { value: "ABC" } })
    fireEvent.click(joinNowButton)

    expect(window.alert).toHaveBeenCalledWith("Room code must be exactly 6 characters")
  })
})
