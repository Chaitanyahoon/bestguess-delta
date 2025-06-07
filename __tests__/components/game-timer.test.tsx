import { render, screen } from "@testing-library/react"
import { GameTimer } from "@/components/game-timer"
import jest from "jest" // Importing jest to fix the undeclared variable error

describe("GameTimer", () => {
  it("renders timer with correct time", () => {
    render(<GameTimer timeLeft={30} totalTime={30} />)
    expect(screen.getByText("30s")).toBeInTheDocument()
    expect(screen.getByText("Time Remaining")).toBeInTheDocument()
  })

  it("shows warning when time is low", () => {
    render(<GameTimer timeLeft={5} totalTime={30} />)
    expect(screen.getByText("Hurry up! Time is running out!")).toBeInTheDocument()
  })

  it("calls onTimeUp when time reaches zero", () => {
    const onTimeUp = jest.fn()
    render(<GameTimer timeLeft={0} totalTime={30} onTimeUp={onTimeUp} />)
    expect(onTimeUp).toHaveBeenCalled()
  })

  it("displays correct progress percentage", () => {
    render(<GameTimer timeLeft={15} totalTime={30} />)
    // Progress should be 50%
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toHaveAttribute("aria-valuenow", "50")
  })
})
