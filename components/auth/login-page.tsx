"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [role, setRole] = useState<"admin" | "employee">("employee")
  const navigate = useNavigate()

  const mockUsers = [
    { email: "admin@restaurant.com", password: "admin123", role: "admin", name: "Admin" },
    { email: "employee@restaurant.com", password: "emp123", role: "employee", name: "John Doe" },
  ]

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password && u.role === role
    )

    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user))
      navigate({ to: role === "admin" ? "/dashboard" : "/orders" })
    } else {
      setError(
        "Invalid credentials. Try admin@restaurant.com / admin123 or employee@restaurant.com / emp123"
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-background to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md elevation-3 bg-card rounded-2xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-card-foreground mb-2">Restaurant</h1>
          <h2 className="text-lg font-semibold text-muted-foreground">Management System</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "employee")}
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="employee">Employee (Tablet)</option>
              <option value="admin">Admin (Orders & Inventory)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-input border border-border rounded-lg text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all elevation-1 active:elevation-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials:</p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-card-foreground">Admin:</span> admin@restaurant.com / admin123
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-card-foreground">Employee:</span> employee@restaurant.com / emp123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
