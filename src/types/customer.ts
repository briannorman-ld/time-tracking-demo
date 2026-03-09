/**
 * Customer — stored per user in IndexedDB. Used for the customer list and entry dropdowns.
 */
export interface Customer {
  id: string
  userId: string
  name: string
  createdAt: string // ISO
}
