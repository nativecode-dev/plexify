import { fs } from '@nofrills/fs'
import { Logger } from './Logger'

export function formatFileName(filename: string, format: string): string {
  const context: { [key: string]: string } = {
    basename: fs.basename(filename, false),
    dirname: fs.dirname(filename).split('/').join('/'),
    ext: fs.ext(filename).replace('.', ''),
    filename,
  }

  const formatted = Object.keys(context).reduce(
    (results, name) => results.replace(`\{${name}\}`, context[name]),
    format,
  )

  Logger.trace(format, formatted, context)

  return formatted
}
