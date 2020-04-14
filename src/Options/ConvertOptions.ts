import { Options } from 'yargs'

export interface ConvertOptions extends Options {
  dryrun: boolean
  filenames: string[]
  minutes: number
  path: string
  processors: number
  rename: boolean
  reverse: boolean
}
