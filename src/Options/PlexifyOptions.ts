import { Options } from 'yargs'

export interface PlexifyOptions extends Options {
  command: string
  disableBars: boolean
}
