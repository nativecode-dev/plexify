import { FileExtension } from './FileExtension'

export interface FileName {
  converted: string
  original: string
  processing: string
  extension: FileExtension
}
