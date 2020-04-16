import { PlexifyOptions } from './PlexifyOptions'

export interface ConvertOptions extends PlexifyOptions {
  dryrun: boolean
  filenames: string[]
  minutes: number
  path: string
  processors: number
  rename: boolean
  reverse: boolean
}
