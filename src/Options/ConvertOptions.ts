import { ScanOptions } from './ScanOptions'

export interface ConvertOptions extends ScanOptions {
  dryrun: boolean
  filenames: string[]
  minutes: number
  path: string
  processors: number
  reverse: boolean
  skipScan: boolean
}
