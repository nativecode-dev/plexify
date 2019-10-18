export interface Video {
  audit?: {
    created?: number
    modified?: number
  }
  filename: string
  lock?: {
    owner: string
    locked: number
  }
}
