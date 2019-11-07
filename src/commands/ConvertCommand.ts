import { all as throttle } from 'promise-parallel-throttle'

import { CommandModule, Arguments } from 'yargs'

import Logger from '../Logger'

import { GlobalOptions } from './options/GlobalOptions'
import { PlexifyManager } from '../PlexifyManager'

export interface ConvertOptions extends GlobalOptions {}

const log = Logger.extend('command:convert')

const ConvertCommand: CommandModule<{}, ConvertOptions> = {
  command: 'convert <path> [options]',
  describe: 'convert the files found in <path> in-place',
  builder: {},

  handler: async (args: Arguments<ConvertOptions>) => {
    const manager = new PlexifyManager(args.path)

    try {
      const files = await manager.files()
      log.trace(args, files)
      const infos = await throttle(files.map(file => () => manager.fileinfo(file)))
      infos.forEach(info => console.log(info))
    } catch (error) {
      log.error(error)
      process.exit(-1)
    } finally {
      process.exit(0)
    }
  },
}

export default ConvertCommand
