import { db, normalizeName } from "../common/DexieDB"


export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  minThreshold: number
  lastUpdated: string
}


export const getIngredients = async (): Promise<Ingredient[]> => db.ingredients.orderBy("name").toArray()
export const addIngredient = async (ingredient: Ingredient) => db.ingredients.add(ingredient)
export const updateIngredient = async (id: string, patch: Partial<Ingredient>) => {
  const now = new Date().toISOString()
  await db.ingredients.update(id, { ...patch, lastUpdated: now })
}
export const deleteIngredient = async (id: string) => db.ingredients.delete(id)

export const findMatchingIngredient = async (itemName: string): Promise<Ingredient | undefined> => {
  const norm = normalizeName(itemName)
  const all = await db.ingredients.toArray()
  return all.find((ing) => {
    const ingNorm = normalizeName(ing.name)
    return ingNorm === norm || ingNorm.includes(norm) || norm.includes(ingNorm)
  })
}