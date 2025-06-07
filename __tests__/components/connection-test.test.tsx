import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ConnectionTest } from "@/components/connection-test"
import jest from "jest" // Declare the jest variable

// Mock fetch
global.fetch = jest.fn()

describe("ConnectionTest", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "OK", rooms: 0, players: 0 }),
    })
  })

  it("renders connection test component", () => {
    render(<ConnectionTest />)
    expect(screen.getByText("Connection Diagnostics")).toBeInTheDocument()
  })

  it("displays test categories", () => {
    render(<ConnectionTest />)
    expect(screen.getByText("Backend Health")).toBeInTheDocument()
    expect(screen.getByText("CORS Configuration")).toBeInTheDocument()
    expect(screen.getByText("Socket Connection")).toBeInTheDocument()
    expect(screen.getByText("Ping Test")).toBeInTheDocument()
  })

  it("runs tests when button is clicked", async () => {
    render(<ConnectionTest />)

    const runButton = screen.getByText("Run Tests Again")
    fireEvent.click(runButton)

    expect(fetch).toHaveBeenCalledWith(
      "https://beatmatch-jbss.onrender.com/health",
      expect.objectContaining({
        mode: "cors",
        headers: { Accept: "application/json" },
      }),
    )
  })

  it("handles backend health check success", async () => {
    render(<ConnectionTest />)

    await waitFor(() => {
      expect(screen.getByText(/Backend OK/)).toBeInTheDocument()
    })
  })

  it("handles backend health check failure", async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

    render(<ConnectionTest />)

    await waitFor(() => {
      expect(screen.getByText(/Backend unreachable/)).toBeInTheDocument()
    })
  })
})
