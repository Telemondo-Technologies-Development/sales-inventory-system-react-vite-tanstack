import Dexie from "dexie"

export type EmployeeRole = "admin" | "manager" | "employee"
export type EmployeeTask = "cashier" | "kitchen" | "waiter" | "runner" | "bar" | "inventory"

export interface Employee {
  id: string
  username?: string          
  password?: string          
  name: string
  age?: number
  email?: string
  phone?: string
  role: EmployeeRole
  tasks: EmployeeTask[]       
  photo?: Blob | null         // stored as Blob (webp)
  resume?: Blob | null        
  createdAt: string
}

class EmployeeDB extends Dexie {
  employees!: Dexie.Table<Employee, string>

  constructor() {
    super("employees-db")
    this.version(1).stores({
      employees: "id, username, name, email, role, createdAt",
    })
    this.employees = this.table("employees")
  }
}

export const employeeDb = new EmployeeDB()

export async function addEmployee(payload: Omit<Employee, "id" | "createdAt">): Promise<string> {
  const id = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `emp-${Date.now()}`
  const createdAt = new Date().toISOString()
  const record: Employee = { id, createdAt, ...payload }
  await employeeDb.employees.add(record)
  return id
}

export async function getAllEmployees(): Promise<Employee[]> {
  return employeeDb.employees.toArray()
}

export async function getEmployee(id: string): Promise<Employee | undefined> {
  return employeeDb.employees.get(id)
}

export async function findEmployeeByUsernameOrEmail(u: string): Promise<Employee | undefined> {
  const q = (u || "").toLowerCase()
  
  return employeeDb.employees
    .filter((e) => (e.username ?? "").toLowerCase() === q || (e.email ?? "").toLowerCase() === q)
    .first()
}

export async function updateEmployee(id: string, patch: Partial<Omit<Employee, "id" | "createdAt">>): Promise<void> {
  const existing = await employeeDb.employees.get(id)
  if (!existing) throw new Error("Employee not found")
  const updated = { ...existing, ...patch }
  await employeeDb.employees.put(updated)
}

export async function deleteEmployee(id: string): Promise<void> {
  await employeeDb.employees.delete(id)
}