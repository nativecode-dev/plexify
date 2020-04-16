import { PlexifyOptions } from './PlexifyOptions'

export interface ScanOptions extends PlexifyOptions {
  filenames: string[]
  minutes: number
  path: string
  reverse: boolean
}
