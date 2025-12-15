// lightweight auth helper used by the UI to decide who can register users.
// In your real app replace with real auth context / API.
export type AppUser = { id: string; username?: string; name?: string; role: "admin" | "manager" | "employee"; tasks?: string[] }

export function getCurrentUser(): AppUser {
  try {
    const raw = localStorage.getItem("currentUser")
    if (raw) return JSON.parse(raw) as AppUser
  } catch {}
  // default for local dev
  return { id: "local-admin", username: "admin", name: "Local Admin", role: "admin", tasks: ["manager"] }
}