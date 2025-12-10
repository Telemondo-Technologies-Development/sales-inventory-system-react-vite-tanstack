import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { Trash2, Edit2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getAllEmployees, deleteEmployee, type Employee } from "@/database/employee-helper/EmployeeDexieDB"
import EmployeeModal from "@/components/employee-system/EmployeeDetails"
import { Button } from "@/components/ui/button"

/**
 * EmployeeView
 * - protect route: redirect non-admin/manager to /login or /orders
 * - ensures currentUser is read from localStorage by getCurrentUser()
 */

export default function EmployeeView() {
  const router = useRouter()
  const current = useMemo(() => getCurrentUser(), [])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filtered, setFiltered] = useState<Employee[]>([])
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [taskFilter, setTaskFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const objectUrls = useRef<Record<string, string>>({})

  // Guard: redirect if user not admin/manager
  useEffect(() => {
    if (!current || (current.role !== "admin" && current.role !== "manager")) {
      // not allowed -> send to orders (employee) or login if not authenticated
      if (!current || !current.id) router.navigate({ to: "/login" })
      else router.navigate({ to: "/orders" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  async function load() {
    const all = await getAllEmployees()
    setEmployees(all)
    setFiltered(all)
    // cleanup & prepare object urls
    Object.values(objectUrls.current).forEach((u) => {
      try { URL.revokeObjectURL(u) } catch {}
    })
    objectUrls.current = {}
    all.forEach((it) => {
      if (it.photo) {
        try {
          objectUrls.current[it.id] = URL.createObjectURL(it.photo)
        } catch {}
      }
    })
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
    if (current.role !== "admin") {
      alert("Only admins can delete users")
      return
    }
    const ok = window.confirm("Delete employee?")
    if (!ok) return
    await deleteEmployee(id)
    await load()
  }


  return (
    <div className="p-4">
      <section className="">
        <header className="flex justify-between items-center bg-primary-foreground mb-[16px] rounded-xl p-2 elevation-1 ">
          <div className="">
            <h1 className="text-3xl font-medium text-primary">Employees Management</h1>
            <p className="text-sm text-foreground">Manage staff accounts & roles</p>
          </div>

          <div className="flex items-center gap-3">
            <input placeholder="Search by name or username" value={query} onChange={(e) => setQuery(e.target.value)} className="px-3 py-2 border rounded-2xl" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border rounded-2xl">
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} className="px-3 py-2 border rounded-2xl">
              <option value="all">All tasks</option>
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen</option>
              <option value="waiter">Waiter</option>
              <option value="runner">Runner</option>
              <option value="bar">Bar</option>
            </select>

            {/* Only admin (or manager) can add users; admin is required to "register" */}
            {["admin", "manager"].includes(current.role) && (
              <Button variant="primary" onClick={() => { setEditId(null); setModalOpen(true) }}>
                Add Employee
              </Button>
            )}

            <Button variant="outline"  onClick={() => load()}>Refresh</Button>
          </div>
        </header>

        <section aria-labelledby="employees-heading">
          <h2 id="employees-heading" className="sr-only">Employees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]">
            {filtered.map((emp) => {
              const photo = objectUrls.current[emp.id]
              return (
                <article key={emp.id} className="flex flex-col h-full rounded-xl p-5 border border-border bg-primary-foreground elevation-1">
                  <header className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-[16px]">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
                        {photo ? <img src={photo} alt={emp.name} className="w-full h-full object-cover" /> : <div className="text-sm text-[#6b6b73]">No photo</div>}
                      </div>
                      <div>
                        <p className="text-xs text-foreground">Employee</p>
                        <p className="font-bold text-lg text-primary">{emp.name}</p>
                        <p className="text-sm text-foreground mt-1">{emp.username ? `@${emp.username}` : ""}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-sm px-2 py-1 rounded-2xl bg-primary-foreground text-primary font-semibold">{emp.role}</span>
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
                      <Button variant="ghost" className="rounded-2xl" onClick={() => { setEditId(emp.id); setModalOpen(true) }}>
                        <Edit2 className="w-4 h-4" /> Edit
                      </Button>

                      <Button variant="outline" className="rounded-2xl" onClick={() => { /* view profile: open another modal or route */ }}>
                        View
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="destructive"  onClick={() => handleDelete(emp.id)}>
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