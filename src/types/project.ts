/**
 * Project — belongs to a customer. Time entries can be scoped to a project.
 */
export interface Project {
  id: string
  userId: string
  customerId: string
  name: string
  createdAt: string // ISO
}
