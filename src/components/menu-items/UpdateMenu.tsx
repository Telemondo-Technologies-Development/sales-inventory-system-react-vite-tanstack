import React, { useEffect, useRef, useState } from "react"
import { Save, X, Edit2, Trash2 } from "lucide-react"
import { processImageFile } from "@/lib/image"
import {
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
  type MenuItem,
} from "@/database/menu-helper/MenuDexieDB"
import { Button } from "@/components/ui/button"

/**
 * UpdateMenuModal
 * - Shows all menu items in a table
 * - Allows inline editing of name / price / category / photo
 * - Save and Cancel per-row, Delete per-row
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSaved?: () => void  // called after any successful save/delete so parent can reload if needed
 */
export default function UpdateMenuModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MenuItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MenuItem> | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const previewUrls = useRef<Record<string, string>>({}) // track created object URLs to revoke

  async function loadItems() {
    setLoading(true)
    setError(null)
    try {
      const all = await getAllMenuItems()
      // create display order (newest first)
      setItems(all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
    } catch (err) {
      console.error(err)
      setError("Failed to load menu items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadItems()
    } else {
      // clear preview urls when closing
      Object.values(previewUrls.current).forEach((u) => {
        try {
          URL.revokeObjectURL(u)
        } catch {}
      })
      previewUrls.current = {}
      setEditingId(null)
      setEditForm(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // begin editing a row
  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditForm({
      name: item.name,
      price: item.price,
      category: item.category,
      // do not copy blob into form (we'll manage image separately via preview)
      image: item.image ?? null,
      imageType: item.imageType ?? null,
    })
    // create preview URL if blob exists
    if (item.image) {
      try {
        const url = URL.createObjectURL(item.image)
        previewUrls.current[item.id] = url
      } catch {}
    }
  }

  function cancelEdit() {
    // revoke preview for editingId if any and it was created
    if (editingId && previewUrls.current[editingId]) {
      try {
        URL.revokeObjectURL(previewUrls.current[editingId])
      } catch {}
      delete previewUrls.current[editingId]
    }
    setEditingId(null)
    setEditForm(null)
    setError(null)
  }

  async function handleSave(id: string) {
    if (!editForm) return
    setSavingId(id)
    setError(null)
    try {
      const patch: Partial<MenuItem> = {}
      if (typeof editForm.name === "string") patch.name = editForm.name.trim()
      if (typeof editForm.price === "number") patch.price = editForm.price
      if (typeof editForm.category === "string") patch.category = editForm.category

      // image handling:
      // - if editForm.image === undefined -> do not change
      // - if editForm.image === null -> remove image
      // - if editForm.image is Blob -> set new image
      if ("image" in editForm) {
        patch.image = editForm.image ?? null
        patch.imageType = editForm.image ? "image/webp" : null
      }

      await updateMenuItem(id, patch)
      if (onSaved) await onSaved()
      await loadItems()
      cancelEdit()
    } catch (err) {
      console.error(err)
      setError("Failed to save changes")
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this menu item? This action cannot be undone.")
    if (!ok) return
    setDeletingId(id)
    setError(null)
    try {
      await deleteMenuItem(id)
      if (onSaved) await onSaved()
      await loadItems()
      // cleanup preview if any
      if (previewUrls.current[id]) {
        try {
          URL.revokeObjectURL(previewUrls.current[id])
        } catch {}
        delete previewUrls.current[id]
      }
    } catch (err) {
      console.error(err)
      setError("Failed to delete menu item")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, id: string) {
    const f = e.target.files?.[0] ?? null
    if (!f || !editingId) return
    setError(null)
    try {
      const { blob } = await processImageFile(f, 1200, 1200, 0.8)
      // revoke previous preview if existed
      if (previewUrls.current[id]) {
        try {
          URL.revokeObjectURL(previewUrls.current[id])
        } catch {}
      }
      const url = URL.createObjectURL(blob)
      previewUrls.current[id] = url
      // set blob into editForm.image
      setEditForm((prev) => ({ ...(prev ?? {}), image: blob, imageType: "image/webp" }))
    } catch (err) {
      console.error(err)
      setError("Failed to process image")
    } finally {
      // reset input so same file can be selected again
      if (e.target) (e.target as HTMLInputElement).value = ""
    }
  }

  function renderImagePreview(item: MenuItem) {
    const id = item.id
    if (editingId === id && editForm?.image !== undefined) {
      // if editForm.image is explicitly null => show "removed"
      if (editForm.image === null) return <div className="text-sm text-muted-foreground">Removed</div>
      // if blob preview exists
      if (previewUrls.current[id]) {
        return <img src={previewUrls.current[id]} alt={item.name} className="w-24 h-16 object-cover rounded" />
      }
      // if editForm.image is a Blob but no preview (unlikely) -> create one temporarily
      if (editForm.image instanceof Blob) {
        try {
          const tmp = URL.createObjectURL(editForm.image)
          previewUrls.current[id] = tmp
          return <img src={tmp} alt={item.name} className="w-24 h-16 object-cover rounded" />
        } catch {
          return <div className="text-sm text-muted-foreground">No preview</div>
        }
      }
      // fallthrough to show existing DB image if any
    }

    // not editing or no edit changes: if DB has image create object url (cached) and show it
    if (item.image) {
      if (!previewUrls.current[id]) {
        try {
          previewUrls.current[id] = URL.createObjectURL(item.image)
        } catch {}
      }
      const url = previewUrls.current[id]
      if (url) return <img src={url} alt={item.name} className="w-24 h-16 object-cover rounded" />
    }

    return <div className="text-sm text-muted-foreground">No image</div>
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center pt-12 px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Update Menu</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" /> Close
            </Button>
          </div>
        </div>

        <div className="p-4">
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className=" border-gray-200 bg-gray-100">
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Image</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Name</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Price</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Category</th>
                  <th className="sticky top-0 z-20 px-4 py-3 text-center text-sm font-semibold text-gray-600 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#6b6b73]">Loading…</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#6b6b73]">No menu items</td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isEditing = editingId === item.id
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-all ${isEditing ? "bg-gray-50" : "bg-white"}`}
                      >
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            {renderImagePreview(item)}
                            {isEditing && (
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, item.id)}
                                />
                                <div className="mt-2 text-xs text-muted-foreground">Replace image</div>
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-xs text-red-600 rounded hover:bg-red-50"
                                    onClick={() => {
                                      // mark as removed
                                      if (previewUrls.current[item.id]) {
                                        try {
                                          URL.revokeObjectURL(previewUrls.current[item.id])
                                        } catch {}
                                        delete previewUrls.current[item.id]
                                      }
                                      setEditForm((prev) => ({ ...(prev ?? {}), image: null }))
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {isEditing ? (
                            <input
                              type="text"
                              value={String(editForm?.name ?? item.name)}
                              onChange={(e) => setEditForm((p) => ({ ...(p ?? {}), name: e.target.value }))}
                              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded w-full text-sm"
                            />
                          ) : (
                            <div className="text-gray-700">{item.name}</div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={String(editForm?.price ?? item.price)}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...(p ?? {}), price: Number(e.target.value || 0) }))
                              }
                              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded w-24 text-sm"
                            />
                          ) : (
                            <div className="text-gray-700">₱{item.price.toFixed(2)}</div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {isEditing ? (
                            <select
                              value={String(editForm?.category ?? item.category)}
                              onChange={(e) => setEditForm((p) => ({ ...(p ?? {}), category: e.target.value }))}
                              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm"
                            >
                              <option>Main</option>
                              <option>Sides</option>
                              <option>Drinks</option>
                              <option>Desserts</option>
                            </select>
                          ) : (
                            <div className="text-gray-700">{item.category}</div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-3">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSave(item.id)}
                                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition"
                                  title="Save"
                                  disabled={savingId === item.id}
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 shadow-sm transition"
                                  title="Cancel"
                                  disabled={savingId === item.id}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(item)}
                                  className="px-3 py-1 bg-white border rounded text-sm text-[#445e91] hover:shadow-sm"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="px-3 py-1 bg-white border rounded text-sm text-red-700 hover:shadow-sm"
                                  title="Delete"
                                  disabled={deletingId === item.id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}