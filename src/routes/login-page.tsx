import { useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { AlertCircle } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { findEmployeeByUsernameOrEmail } from "@/database/employee-helper/EmployeeDexieDB"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"


const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "Please enter username/email."),
  password: z.string().min(1, "Please enter your password."),
})

type LoginFormValues = z.infer<typeof LoginSchema>


export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema) as any,
    defaultValues: {
      identifier: "",
      password: "",
    },
    mode: "onSubmit",
  })

  const routeForRole = (role: string) => {
    if (role === "admin") return "/sales-view"
    if (role === "manager") return "/order-view"
    return "/employees"
  }

  const handleLogin = async (values: LoginFormValues) => {
    setError("")

    setLoading(true)
    try {
      const found = await findEmployeeByUsernameOrEmail(values.identifier.trim())
      if (!found) {
        setError("No account found for that username/email. Ask an admin to register you.")
        return
      }

      if (!found.password) {
        setError("This account does not have a password set. Ask an admin to set credentials.")
        return
      }

      if (found.password !== values.password) {
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
    <section className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md bg-primary-foreground rounded-2xl p-6 sm:p-8 elevation-3 mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-medium text-primary">Serenity Restaurant Management</h1>
          <p className="text-sm text-foreground font-light">Management System — sign in with your registered account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-5">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input autoComplete="username" placeholder="Enter username or email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input autoComplete="current-password" type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="flex items-start gap-3 p-3 bg-tertiary border border-tertiary rounded-2xl">
                <AlertCircle className="w-5 h-5 text-primary-foreground" />
                <p className="text-sm text-primary-foreground">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading} className="w-full py-3">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-xs text-muted-foreground">
          <p>If you don't have an account yet, ask an admin to register you.</p>
        </div>
      </div>
    </section>
  )
}