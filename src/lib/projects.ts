/**
 * Project CRUD — projects belong to a customer. Per user.
 */
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import type { Project } from '@/types/project'

export async function getProjectsByCustomer(
  userId: string,
  customerId: string
): Promise<Project[]> {
  return db.projects
    .where('[userId+customerId]')
    .equals([userId, customerId])
    .sortBy('name')
}

export async function getProjectsByUser(userId: string): Promise<Project[]> {
  return db.projects.where('userId').equals(userId).sortBy('name')
}

export async function getProjectNamesForCustomer(
  userId: string,
  customerId: string
): Promise<string[]> {
  const list = await getProjectsByCustomer(userId, customerId)
  return list.map((p) => p.name)
}

export async function addProject(
  userId: string,
  customerId: string,
  name: string
): Promise<Project> {
  const project: Project = {
    id: uuidv4(),
    userId,
    customerId,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
  await db.projects.add(project)
  return project
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  const p = await db.projects.get(projectId)
  if (!p || p.userId !== userId) return false
  await db.projects.delete(projectId)
  return true
}
