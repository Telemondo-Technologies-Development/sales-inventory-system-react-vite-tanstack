import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { addExpense, updateExpense } from "../../database/expenses-helper/ExpensesDexieDB"
import type { Expense } from "../../database/expenses-helper/ExpensesDexieDB"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  initial?: Expense | null
  onClose: () => void
  onSaved?: (expense: Expense) => void
}

// Zod schema for expense validation
const ExpenseSchema = z.object({
  item: z.string().trim().min(1, "Please enter an item description."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unit: z.string().trim().min(1, "Unit is required."),
  unitWeight: z.string().trim().optional(),
  cost: z.coerce.number().min(0.01, "Cost must be greater than zero."),
  supplier: z.string().trim().optional(),
  date: z.string().min(1, "Date is required."),
  notes: z.string().trim().optional(),
})
type ExpenseFormValues = z.infer<typeof ExpenseSchema>

export default function ExpensesDetails({ open, initial = null, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseSchema) as any,
    mode: "onChange",
    defaultValues: {
      item: "",
      quantity: 1,
      unit: "bag",
      unitWeight: "25kg",
      cost: 0,
      supplier: "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  })

  // reset when opened or initial changes
  useEffect(() => {
    if (!open) return
    if (initial) {
      form.reset({
        item: initial.item ?? "",
        quantity: initial.quantity ?? 1,
        unit: initial.unit ?? "bag",
        unitWeight: initial.unitWeight ?? "",
        cost: initial.cost ?? 0,
        supplier: initial.supplier ?? "",
        date: initial.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: initial.notes ?? "",
      })
    } else {
      form.reset({
        item: "",
        quantity: 1,
        unit: "bag",
        unitWeight: "25kg",
        cost: 0,
        supplier: "",
        date: new Date().toISOString().slice(0, 10),
        notes: "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  if (!open) return null

  const onSubmit = async (values: ExpenseFormValues) => {
    const expense: Expense = {
      id: initial?.id ?? `exp-${Date.now()}`,
      item: values.item.trim(),
      quantity: values.quantity,
      unit: values.unit.trim(),
      unitWeight: values.unitWeight?.trim() || undefined,
      cost: values.cost,
      supplier: values.supplier?.trim() || undefined,
      date: new Date(values.date).toISOString(),
      notes: values.notes?.trim() || undefined,
    }

    setSaving(true)
    try {
      if (initial) {
        await updateExpense(expense)
      } else {
        await addExpense(expense)
      }
      onSaved?.(expense)
      onClose()
    } catch (err) {
      console.error("Failed to save expense", err)
      form.setError("item", { type: "server", message: "Failed to save expense. Try again." })
      alert("Failed to save expense. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-medium">{initial ? "Edit Expense" : "Add Expense"}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
            <X />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item (description)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bag of flour 25kg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="bag" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit weight</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="25kg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total cost (₱)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={0.01} step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rafsky Trading" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Invoice #, delivery note..." rows={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
                <Button type="button" variant="ghost" onClick={onClose} className="py-2 px-4">
                  Cancel
                </Button>
                <Button type="submit" className="py-2 px-4 cursor-pointer" variant="primary" disabled={saving || !form.formState.isValid}>
                  {saving ? "Saving…" : initial ? "Save Changes" : "Save Expense"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}