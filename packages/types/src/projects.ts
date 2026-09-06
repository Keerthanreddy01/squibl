import type { ProjectStatus } from '@squibl/constants'

export interface ProjectData {
  id?: string
  owner_uid: string
  name: string
  tagline: string
  description: string
  stack: string[]
  team: string[]
  github_url?: string
  live_url?: string
  status: ProjectStatus
  author_name?: string
  author_avatar?: string
  likes?: string[]
  created_at?: string
  updated_at?: string
}
