import { Options } from 'yargs'

export interface ScanOptions extends Options {
  filenames: string[]
  minutes: number
  path: string
  reverse: boolean
}
