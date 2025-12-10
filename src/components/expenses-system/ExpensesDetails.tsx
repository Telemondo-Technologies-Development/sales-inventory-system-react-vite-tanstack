"use client"

import React, { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useForm } from "react-hook-form"
import { addExpense, updateExpense } from "../../database/expenses-helper/ExpensesDexieDB"
import type { Expense } from "../../database/expenses-helper/ExpensesDexieDB"

// shadcn UI primitives — adjust import paths if your project structure differs
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  initial?: Expense | null
  onClose: () => void
  onSaved?: (expense: Expense) => void
}


/**
 * ExpensesDetails modal — rewritten to use react-hook-form + shadcn primitives.
 * - Validation: basic (required item, quantity >=1, cost > 0)
 * - Uses RHF's formState.isValid (mode: "onChange") to enable submit button.
 * - Resets form when `open` or `initial` changes.
 */
export default function ExpensesDetails({ open, initial = null, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<Expense>({
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
        date: (initial.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
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

  const onSubmit = async (values: Expense) => {
    const item = (values.item || "").trim()
    const quantity = Number(values.quantity || 0)
    const cost = Number(values.cost || 0)

    if (!item) {
      form.setError("item", { type: "required", message: "Please enter an item description." })
      return
    }
    if (quantity <= 0) {
      form.setError("quantity", { type: "min", message: "Quantity must be at least 1." })
      return
    }
    if (cost <= 0) {
      form.setError("cost", { type: "min", message: "Cost must be greater than zero." })
      return
    }

    const expense: Expense = {
      id: initial?.id ?? `exp-${Date.now()}`,
      item,
      quantity,
      unit: values.unit || "bag",
      unitWeight: values.unitWeight?.trim() || undefined,
      cost,
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-lg border border-[#e8e8ec] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-[#256489]">{initial ? "Edit Expense" : "Record Expense"}</h3>
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
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Item (description)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bag of flour 25kg" />
                      </FormControl>
                      {fieldState.error?.message && <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>}
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={1} onChange={(e) => field.onChange(Number(e.target.value || 0))} />
                        </FormControl>
                        {fieldState.error?.message && <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>}
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
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Total cost (₱)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min={0} onChange={(e) => field.onChange(Number(e.target.value || 0))} />
                        </FormControl>
                        {fieldState.error?.message && <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>}
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
    </div>
  )
}