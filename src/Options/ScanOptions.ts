import { Options } from 'yargs'

export interface ScanOptions extends Options {
  minutes: number
  path: string
  reverse: boolean
}
