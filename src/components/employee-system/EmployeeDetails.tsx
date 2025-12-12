import React, { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { processImageFile } from "@/lib/image"
import {
  addEmployee,
  getEmployee,
  updateEmployee,
  type Employee,
  type EmployeeRole,
  type EmployeeTask,
} from "@/database/employee-helper/EmployeeDexieDB"

const ALL_TASKS: EmployeeTask[] = ["cashier", "kitchen", "waiter", "runner", "bar"]
const ROLES: EmployeeRole[] = ["admin", "manager", "employee"]

/* Zod schema */

const EmployeeSchema = z.object({
  username: z.string().trim().min(0).optional(),
  password: z.string().trim().min(0).optional(),
  name: z.string().trim().min(1, "Name is required"),
  age: z.coerce.number().min(15, { message: "Age must be 15 or older" }).optional(),
  email: z.string().trim().email({ message: "Invalid email" }).optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)).optional(),
  phone: z.string().trim().optional().refine((v) => !v || /^\+?[0-9\s()-]{7,}$/.test(v), {
    message: "Enter a valid phone number",
  }),
  role: z.enum(["admin", "manager", "employee"]).default("employee"),
  tasks: z.array(z.enum(["cashier", "kitchen", "waiter", "runner", "bar"])).default([]).optional(),
})

type EmployeeFormValues = z.infer<typeof EmployeeSchema>

export default function EmployeeModal({
  open,
  onClose,
  onSaved,
  editId = null,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  editId?: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBlob, setPhotoBlob] = useState<Blob | null | undefined>(undefined) // undefined = unchanged on edit
  const [resumeName, setResumeName] = useState<string | null>(null)
  const [resumeBlob, setResumeBlob] = useState<Blob | null | undefined>(undefined)

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeSchema) as any,
    defaultValues: {
      username: "",
      password: "",
      name: "",
      age: undefined,
      email: undefined,
      phone: "",
      role: "employee",
      tasks: [],
    },
  })

  useEffect(() => {
    if (!open) return
    setError(null)

    if (editId) {
      setLoading(true)
      ;(async () => {
        try {
          const it = await getEmployee(editId)
          if (!it) {
            setError("Employee not found")
            return
          }
          // populate form
          form.reset({
            username: it.username ?? "",
            password: "", // don't prefill
            name: it.name,
            age: it.age ?? undefined,
            email: it.email ?? undefined,
            phone: it.phone ?? "",
            role: it.role,
            tasks: it.tasks ?? [],
          })

          // preview photo
          if (it.photo) {
            try {
              const url = URL.createObjectURL(it.photo)
              setPhotoPreview(url)
              setPhotoBlob(it.photo)
            } catch {
              setPhotoPreview(null)
              setPhotoBlob(it.photo ?? null)
            }
          } else {
            setPhotoPreview(null)
            setPhotoBlob(it.photo ?? null)
          }

          if (it.resume) {
            setResumeName("uploaded_resume")
            setResumeBlob(it.resume)
          } else {
            setResumeName(null)
            setResumeBlob(it.resume ?? null)
          }
        } catch (err) {
          console.error(err)
          setError("Failed to load employee")
        } finally {
          setLoading(false)
        }
      })()
    } else {
      // new: reset everything
      form.reset({
        username: "",
        password: "",
        name: "",
        age: undefined,
        email: undefined,
        phone: "",
        role: "employee",
        tasks: [],
      })
      setPhotoPreview(null)
      setPhotoBlob(undefined)
      setResumeName(null)
      setResumeBlob(undefined)
    }

    return () => {
      if (photoPreview) {
        try {
          URL.revokeObjectURL(photoPreview)
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    setError(null)
    try {
      const { blob } = await processImageFile(f, 800, 800, 0.8)
      if (photoPreview) {
        try {
          URL.revokeObjectURL(photoPreview)
        } catch {}
      }
      const preview = URL.createObjectURL(blob)
      setPhotoPreview(preview)
      setPhotoBlob(blob)
    } catch (err) {
      console.error(err)
      setError("Failed to process photo")
    } finally {
      if (e.target) (e.target as HTMLInputElement).value = ""
    }
  }

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    setResumeName(f.name)
    setResumeBlob(f)
    if (e.target) (e.target as HTMLInputElement).value = ""
  }

  function toggleTask(t: EmployeeTask) {
    const current = form.getValues("tasks") ?? []
    if (current.includes(t)) {
      form.setValue(
        "tasks",
        (current as EmployeeTask[]).filter((x) => x !== t)
      )
    } else {
      form.setValue("tasks", [...(current as EmployeeTask[]), t])
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)
    const result = await form.trigger()
    if (!result) return

    const values = form.getValues()
    if (!values.name || values.name.trim() === "") {
      setError("Name is required")
      return
    }
    if (!editId && (!values.password || values.password.trim().length < 6)) {
      setError("Password must be at least 6 characters for new employees")
      return
    }

    setSaving(true)
    try {
      const payload: Omit<Employee, "id" | "createdAt"> = {
        username: values.username || undefined,
        password: values.password || undefined,
        name: values.name.trim(),
        age: values.age === undefined ? undefined : Number(values.age),
        email: values.email || undefined,
        phone: values.phone || undefined,
        role: values.role,
        tasks: values.tasks ?? [],
        photo: typeof photoBlob === "undefined" ? undefined : (photoBlob as Blob | null),
        resume: typeof resumeBlob === "undefined" ? undefined : (resumeBlob as Blob | null),
      }

      if (editId) {
        // don't overwrite password if empty string
        const patch: Partial<Omit<Employee, "id" | "createdAt">> = { ...payload }
        if (!values.password) delete patch.password
        await updateEmployee(editId, patch)
      } else {
        await addEmployee(payload)
      }

      if (onSaved) await onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      setError("Failed to save employee")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <Form {...form}>
        <form onSubmit={handleSave} className="relative z-10 w-full max-w-xl bg-primary-foreground rounded-2xl p-6 elevation overflow-auto">
          <h3 className="text-lg font-semibold mb-4">{editId ? "Edit Employee" : "Add Employee"}</h3>

          {error && <div className="text-sm text-error mb-3">{error}</div>}
          {loading && <div className="text-sm text-muted-foreground mb-3">Loading…</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={15} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Optional login username</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormDescription>{editId ? "Leave blank to keep existing password" : "Set a password for this account"}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select onValueChange={(v) => field.onChange(v)} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sm:col-span-2">
              <FormLabel>Tasks (job responsibilities)</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_TASKS.map((t) => {
                  const selected = (form.getValues("tasks") || []).includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTask(t)}
                      className={`px-3 py-1 rounded text-sm border ${selected ? "bg-[#266489] text-white" : "bg-white text-gray-700"}`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            <FormItem>
              <FormLabel>Photo</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={handlePhotoChange} />
              </FormControl>
              <FormDescription>Upload a clear headshot (JPEG/PNG).</FormDescription>
              {photoPreview && (
                <img src={photoPreview} alt="preview" className="mt-2 w-28 h-20 object-cover rounded" />
              )}
              <FormMessage />
            </FormItem>

            <FormItem className="sm:col-span-2">
              <FormLabel>Resume (PDF / DOCX)</FormLabel>
              <FormControl>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
              </FormControl>
              <FormDescription>Optional. Accepted formats: PDF, DOC, DOCX.</FormDescription>
              {resumeName && (
                <div className="mt-2 text-sm text-muted-foreground ">{resumeName}</div>
              )}
              <FormMessage />
            </FormItem>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}