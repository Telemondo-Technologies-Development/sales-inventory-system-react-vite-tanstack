import type React from "react"
import { useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { AlertCircle } from "lucide-react"
import { findEmployeeByUsernameOrEmail } from "@/database/employee-helper/EmployeeDexieDB"


export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const routeForRole = (role: string) => {
    if (role === "admin") return "/sales-view"
    if (role === "manager") return "/order-view"
    return "/employees"
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!emailOrUsername.trim() || !password) {
      setError("Please enter username/email and password.")
      return
    }

    setLoading(true)
    try {
      const found = await findEmployeeByUsernameOrEmail(emailOrUsername.trim())
      if (!found) {
        setError("No account found for that username/email. Ask an admin to register you.")
        return
      }

      if (!found.password) {
        setError("This account does not have a password set. Ask an admin to set credentials.")
        return
      }

      if (found.password !== password) {
        setError("Invalid credentials.")
        return
      }

 
      const publicUser = {
        id: found.id,
        username: found.username ?? found.email ?? found.id,
        name: found.name,
        role: found.role,
      }
      try {
        localStorage.setItem("currentUser", JSON.stringify(publicUser))
      } catch {

      }

      router.navigate({ to: routeForRole(found.role) })
    } catch (err) {
      console.error("Login lookup failed", err)
      setError("An unexpected error occurred. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-primary-foreground rounded-2xl p-8 elevation-3">
        <div className="mb-6">
          <h1 className="text-3xl font-medium text-primary">Serenity Restaurant Management</h1>
          <p className="text-sm text-foreground font-light">Management System — sign in with your registered account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Username or Email</label>
            <input
              autoComplete="username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="Enter username or email"
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Password</label>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 bg-tertiary border border-tertiary rounded-2xl">
              <AlertCircle className="w-5 h-5 text-primary-foreground" />
              <p className="text-sm text-primary-foreground">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/80 transition-all "
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-xs text-muted-foreground">
          <p>If you don't have an account yet, ask an admin to register you.</p>
        </div>
      </div>
    </section>
  )
}