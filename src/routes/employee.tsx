import { useEffect, useMemo, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useRouter } from "@tanstack/react-router"
import { Trash2, Edit2, Search } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getAllEmployees, deleteEmployee, type Employee } from "@/database/employee-helper/EmployeeDexieDB"
import EmployeeModal from "@/components/employee-system/EmployeeDetails"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * EmployeeView
 * - protect route: redirect non-admin/manager to /login or /orders
 * - ensures currentUser is read from localStorage by getCurrentUser()
 */

export default function EmployeeView() {
  const router = useRouter()
  const current = useMemo(() => getCurrentUser(), [])
  const currentRole = current?.role
  const canManageEmployees = currentRole === "admin" || currentRole === "manager"
  const canDeleteEmployees = currentRole === "admin"

  const [employees, setEmployees] = useState<Employee[]>([])
  const [filtered, setFiltered] = useState<Employee[]>([])
  const [allowSetup, setAllowSetup] = useState(false)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [taskFilter, setTaskFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const objectUrls = useRef<Record<string, string>>({})

  // Guard: redirect if user not authenticated, unless this is the initial setup (no employees yet)
  useEffect(() => {
    if (allowSetup) return
    if (!current || !current.id) {
      router.navigate({ to: "/login" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, allowSetup])

  async function load() {
    const all = await getAllEmployees()
    setEmployees(all)
    setFiltered(all)
    setAllowSetup(all.length === 0)

    // cleanup & prepare object urls
    Object.values(objectUrls.current).forEach((u) => {
      try {
        URL.revokeObjectURL(u)
      } catch {}
    })
    objectUrls.current = {}
    for (const it of all) {
      if (!it.photo) continue
      try {
        objectUrls.current[it.id] = URL.createObjectURL(it.photo)
      } catch {}
    }
  }

  useEffect(() => {
    load()
    return () => {
      Object.values(objectUrls.current).forEach((u) => {
        try { URL.revokeObjectURL(u) } catch {}
      })
    }
  }, [])

  useEffect(() => {
    let out = employees
    if (query.trim()) {
      const q = query.toLowerCase()
      out = out.filter((e) => e.name.toLowerCase().includes(q) || (e.username ?? "").toLowerCase().includes(q))
    }
    if (roleFilter !== "all") out = out.filter((e) => e.role === roleFilter)
    if (taskFilter !== "all") out = out.filter((e) => (e.tasks || []).includes(taskFilter as any))
    setFiltered(out)
  }, [employees, query, roleFilter, taskFilter])

  async function handleDelete(id: string) {
    if (!canDeleteEmployees) {
      alert("Only admins can delete users")
      return
    }
    const ok = window.confirm("Delete employee?")
    if (!ok) return
    await deleteEmployee(id)
    await load()
  }


  return (
    <div className="p-4 sm:p-6">
      <section>
        <div className="mb-4 rounded-2xl bg-primary-foreground p-4 elevation-1">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="w-full lg:w-[570px] ">
              <h1 className="text-2xl font-medium text-primary whitespace-normal wrap-break-word">Employees Management</h1>
              <p className="text-sm text-foreground">Manage staff accounts & roles</p>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full lg:flex lg:flex-wrap lg:items-center lg:justify-end">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or username"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={taskFilter} onValueChange={setTaskFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All tasks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tasks</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="runner">Runner</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Only admin/manager can add users */}
              {canManageEmployees ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditId(null)
                    setModalOpen(true)
                  }}
                  className="w-full lg:w-auto"
                >
                  Add Employee
                </Button>
              ) : (
                <div className="hidden lg:block" />
              )}

              <Button variant="outline" onClick={() => load()} className="w-full lg:w-auto">
                Refresh
              </Button>
            </div>
          </header>
        </div>

        <section aria-labelledby="employees-heading">
          <h2 id="employees-heading" className="sr-only">Employees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((emp) => {
              const photo = objectUrls.current[emp.id]
              return (
                <article key={emp.id} className="flex flex-col h-full rounded-2xl p-5 bg-primary-foreground elevation-1">
                  <header className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-sm text-muted-foreground">No photo</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-foreground">Employee</p>
                        <p className="font-bold text-lg text-primary whitespace-normal wrap-break-word">{emp.name}</p>
                        <p className="text-sm text-foreground mt-1">{emp.username ? `@${emp.username}` : ""}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-sm px-2 py-1 rounded-2xl bg-primary-foreground text-primary font-semibold capitalize">{emp.role}</span>
                      <span className="text-xs text-foreground mt-2">{new Date(emp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </header>

                  <section className="text-sm text-foreground mb-4 flex-1">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-foreground">Age</span>
                        <span className="font-semibold">{emp.age ?? "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground">Email</span>
                        <span className="font-semibold">{emp.email ?? "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground">Phone</span>
                        <span className="font-semibold">{emp.phone ?? "-"}</span>
                      </div>

                      <div className="pt-2">
                        <div className="text-xs text-foreground mb-2">Tasks</div>
                        <div className="flex flex-wrap gap-2">
                          {(emp.tasks || []).map((t) => (
                            <span key={t} className="text-xs px-2 py-1 rounded-xl bg-primary text-primary-foreground">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <footer className="mt-auto flex items-center justify-between gap-4">
                    <div className="flex gap-2 flex-1">
                      <Button variant="outline" className="rounded-2xl" onClick={() => { setEditId(emp.id); setModalOpen(true) }}>
                        <Edit2 className="w-4 h-4" /> Edit
                      </Button>

                      <Button variant="outline" className="rounded-2xl" disabled>
                        View
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="danger" onClick={() => handleDelete(emp.id)} disabled={!canDeleteEmployees}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </footer>
                </article>
              )
            })}
          </div>
        </section>
      </section>

      <EmployeeModal
        open={modalOpen}
        editId={editId}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          await load()
          setModalOpen(false)
        }}
      />
    </div>
  )
}

export const Route = createFileRoute("/employee")({
  component: EmployeeView,
})