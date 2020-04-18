import { StreamFile } from './StreamFile'
import { FileName } from './FileName'

export interface FileContext {
  dryrun: boolean
  file: StreamFile
  filename: FileName
}
