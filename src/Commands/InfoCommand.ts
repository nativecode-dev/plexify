import { fs } from '@nofrills/fs'
import { CommandModule, Arguments } from 'yargs'

import { InfoOptions } from '../Options/InfoOptions'
import { getMediaInfo } from '../MediaFunctions'

export class InfoCommand implements CommandModule<{}, InfoOptions> {
  aliases = ['info']
  command = 'info <filename>'
  builder = {}

  handler = async (args: Arguments<InfoOptions>) => {
    const exists = await fs.exists(args.filename)

    if (exists) {
      const info = await getMediaInfo(args.filename)
      console.log(info)
    } else {
      console.log('file not found', args.filename)
    }
  }
}
