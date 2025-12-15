import { db } from "../common/DexieDB"

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  tableNumber: string
  items: OrderItem[]
  notes: string
  status: "pending" | "served" | "payment"
  createdAt: string
  subtotal: number
  tax: number
  total: number
  paymentRecords?: PaymentRecord[]
}


export interface PaymentRecord {
  id: string
  method: "Cash" | "Card" | "Online"
  amount: number
  reference?: string
  createdAt: string
}



export const getOrders = async (): Promise<Order[]> => db.orders.orderBy("createdAt").reverse().toArray()
export const addOrder = async (order: Order) => db.orders.add(order)
export const updateOrder = async (order: Order) => db.orders.put(order)
export const updateOrderStatus = async (orderId: string, status: Order["status"]) =>
  db.orders.update(orderId, { status })
export const deleteOrder = async (orderId: string) => db.orders.delete(orderId)

export const addPaymentRecord = async (orderId: string, payment: PaymentRecord) => {
  const order = await db.orders.get(orderId)
  if (!order) throw new Error("Order not found")
  order.paymentRecords = [...(order.paymentRecords || []), payment]
  await db.orders.put(order)
}