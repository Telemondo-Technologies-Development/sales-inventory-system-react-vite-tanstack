import { db } from "../common/DexieDB"
import type { Order, PaymentRecord } from "../common/DexieDB"

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