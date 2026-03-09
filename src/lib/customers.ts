/**
 * Customer CRUD — per user. Seed data is in seed/seedCustomers.ts; call ensureCustomersSeeded when loading.
 */
import { db } from '@/lib/db'
import type { Customer } from '@/types/customer'
import { ensureCustomersSeeded } from '@/seed/seedCustomers'
import { updateEntriesCustomerName } from '@/lib/entries'
import { v4 as uuidv4 } from 'uuid'

export async function getCustomers(userId: string): Promise<Customer[]> {
  await ensureCustomersSeeded(userId)
  const list = await db.customers.where('userId').equals(userId).sortBy('name')
  // Dedupe by name (in case of legacy duplicate rows)
  const seen = new Set<string>()
  return list.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
}

/** Returns just customer names for dropdowns (same order as getCustomers). */
export async function getCustomerNames(userId: string): Promise<string[]> {
  const list = await getCustomers(userId)
  return list.map((c) => c.name)
}

/** Create a new customer for the user. Returns the created customer. */
export async function createCustomer(userId: string, name: string): Promise<Customer> {
  await ensureCustomersSeeded(userId)
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Customer name is required')
  const existing = await db.customers.where('userId').equals(userId).toArray()
  if (existing.some((c) => c.name === trimmed)) {
    const found = existing.find((c) => c.name === trimmed)!
    return found
  }
  const customer: Customer = {
    id: uuidv4(),
    userId,
    name: trimmed,
    createdAt: new Date().toISOString(),
  }
  await db.customers.put(customer)
  return customer
}

export async function updateCustomer(
  customerId: string,
  userId: string,
  updates: { name: string }
): Promise<Customer | undefined> {
  const customer = await db.customers.get(customerId)
  if (!customer || customer.userId !== userId) return undefined
  const oldName = customer.name
  const newName = updates.name.trim()
  if (!newName) return undefined
  const updated: Customer = {
    ...customer,
    name: newName,
  }
  await db.customers.put(updated)
  await updateEntriesCustomerName(userId, oldName, newName)
  return updated
}

export async function deleteCustomer(
  customerId: string,
  userId: string
): Promise<boolean> {
  const customer = await db.customers.get(customerId)
  if (!customer || customer.userId !== userId) return false
  await db.customers.delete(customerId)
  return true
}
