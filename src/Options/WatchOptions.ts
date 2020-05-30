import { DefaultOptions } from './DefaultOptions'

export interface WatchOptions extends DefaultOptions {
  cwd: string
  extensions: string[]
}
