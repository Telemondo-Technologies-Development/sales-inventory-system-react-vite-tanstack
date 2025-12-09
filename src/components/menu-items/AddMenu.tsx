import React, { useState } from "react"
import { addMenuItem } from "@/database/menu-helper/MenuDexieDB"
import { processImageFile } from "@/lib/image"
import { Button } from "@/components/ui/button"

/**
 * Simple modal component (no external dialog lib required).
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSaved: () => Promise<void> | void  (parent can reload menu)
 */
export default function MenuSystem({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [category, setCategory] = useState("Main")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const reset = () => {
    setName("")
    setPrice("")
    setCategory("Main")
    setFile(null)
    setPreview(null)
    setError(null)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    setFile(f)
    try {
      setLoading(true)
      const { dataUrl } = await processImageFile(f, 1200, 1200, 0.8)
      setPreview(dataUrl)
    } catch (err) {
      console.error(err)
      setError("Failed to process image")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !price) {
      setError("Name and price are required")
      return
    }

    setLoading(true)
    try {
      let imageBlob: Blob | undefined
      let imageType: string | undefined

      if (file) {
        // convert and resize to webp
        const processed = await processImageFile(file, 1200, 1200, 0.8)
        imageBlob = processed.blob
        imageType = "image/webp"
      }

      await addMenuItem({
        name: name.trim(),
        price: Number(price),
        category,
        image: imageBlob ?? null,
        imageType: imageType ?? null,
      })

      reset()
      onClose()
      if (onSaved) await onSaved()
    } catch (err) {
      console.error(err)
      setError("Failed to save menu item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { onClose(); reset() }} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg bg-white rounded-lg p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-4">Add Menu Item</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              value={price as any}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option>Main</option>
              <option>Sides</option>
              <option>Drinks</option>
              <option>Desserts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Photo (optional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {loading && <div className="text-sm text-muted-foreground mt-2">Processing image...</div>}
            {preview && <img src={preview} alt="preview" className="mt-3 w-36 h-24 object-cover rounded" />}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => { onClose(); reset() }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}