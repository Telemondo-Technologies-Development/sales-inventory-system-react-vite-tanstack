import { db } from "../common/DexieDB"

export interface MenuItem {
  id: string                 // string ID (crypto.randomUUID or stable string)
  name: string
  price: number
  category: string
  image?: Blob | null
  imageType?: string | null
  createdAt: string
}


export async function addMenuItem(item: {
  name: string
  price: number
  category: string
  image?: Blob | null
  imageType?: string | null
}): Promise<string> {
  const id =
    typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `menu-${Date.now()}`
  const createdAt = new Date().toISOString()
  const dbItem: MenuItem = {
    id,
    name: item.name,
    price: item.price,
    category: item.category,
    image: item.image ?? null,
    imageType: item.imageType ?? null,
    createdAt,
  }
  await db.menuItems.add(dbItem)
  return id
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  return db.menuItems.toArray()
}

export async function getMenuItem(id: string): Promise<MenuItem | undefined> {
  return db.menuItems.get(id)
}

export async function updateMenuItem(
  id: string,
  patch: Partial<Omit<MenuItem, "id" | "createdAt">>
): Promise<void> {
  const existing = await db.menuItems.get(id)
  if (!existing) throw new Error("Menu item not found")
  const updated = { ...existing, ...patch }
  await db.menuItems.put(updated)
}

export async function deleteMenuItem(id: string): Promise<void> {
  await db.menuItems.delete(id)
}

export async function clearAllMenuItems(): Promise<void> {
  await db.menuItems.clear()
}