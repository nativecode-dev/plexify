import { ScanOptions } from './ScanOptions'

export interface ConvertOptions extends ScanOptions {
  dryrun: boolean
  format: string
  filenames: string[]
  minutes: number
  path: string
  preset: string
  processors: number
  reverse: boolean
  skipScan: boolean
}
