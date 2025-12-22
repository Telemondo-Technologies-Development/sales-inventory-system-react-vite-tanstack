import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "./App"
import "./styles.css"

describe("App", () => {
  test("renders login page", async () => {
    render(<App />)
    // The app shows the login page for the root route
    expect(await screen.findByText("Serenity Restaurant Management")).toBeDefined()
  })
})