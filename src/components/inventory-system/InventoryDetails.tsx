import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { addExpense, type Expense } from "../../database/expenses-helper/ExpensesDexieDB"

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  onSaved?: (expense: Expense) => void
}

const InventorySchema = z.object({
  item: z.string().trim().min(1, "Please enter an item description."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unit: z.string().trim().min(1, "Unit is required."),
  unitWeight: z.string().trim().optional(),
  cost: z.coerce.number().min(0.01, "Cost must be greater than zero."),
  supplier: z.string().trim().optional(),
  date: z.string().min(1, "Date is required."),
  notes: z.string().trim().optional(),
})
type InventoryFormValues = z.infer<typeof InventorySchema>

export default function InventoryDetails({ open, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(InventorySchema) as any,
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

  useEffect(() => {
    if (!open) return
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
    setSaving(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const onSubmit = async (values: InventoryFormValues) => {
    const expense: Expense = {
      id: `exp-${Date.now()}`,
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
      await addExpense(expense)
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-lg border border-[#e8e8ec] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Record Expense</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <X />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-auto space-y-4">
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
                    {saving ? "Saving…" : "Save Expense"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}