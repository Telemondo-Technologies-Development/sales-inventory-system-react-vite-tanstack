import Dexie from "dexie"
import type { Order } from "../order-helper/OrderDexieDB"
import type { Ingredient } from "../inventory-helper/InventoryDexieDB"
import type { Expense } from "../expenses-helper/ExpensesDexieDB"


class AppDB extends Dexie {
  orders!: Dexie.Table<Order, string>
  ingredients!: Dexie.Table<Ingredient, string>
  menuItems!: Dexie.Table<{ id: string; name: string; price: number; category: string; image?: string }, string>
  expenses!: Dexie.Table<Expense, string>

  constructor() {
    super("myapp-db")
    this.version(2).stores({
      orders: "id, tableNumber, status, createdAt",
      ingredients: "id, name",
      menuItems: "id, name, category",
      expenses: "id, item, supplier, date",
    })

    this.orders = this.table("orders")
    this.ingredients = this.table("ingredients")
    this.menuItems = this.table("menuItems")
    this.expenses = this.table("expenses")
  }
}

export const db = new AppDB()

/* ---------- Utility: normalize product name for matching ---------- */
export function normalizeName(s?: string) {
  if (!s) return ""
  return s
    .toLowerCase()
    .replace(/\b(kg|g|gram|grams|bag|bags|pc|pcs|piece|pieces|liter|litre|l|x)\b/g, "")
    .replace(/[\d\.,\-\/\(\)]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}