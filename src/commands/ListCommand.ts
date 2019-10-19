import { all as throttle } from 'promise-parallel-throttle'

import { CommandModule, Arguments } from 'yargs'

import Logger from '../Logger'

import { GlobalOptions } from './options/GlobalOptions'
import { PlexifyManager } from '../PlexifyManager'

export type ListCommandOptions = {} & GlobalOptions

const log = Logger.extend('command:list')

const ListCommand: CommandModule<{}, ListCommandOptions> = {
  aliases: ['ls'],
  command: 'list <path>',
  builder: {},

  handler: async (args: Arguments<ListCommandOptions>) => {
    const manager = new PlexifyManager(args.path)
    const files = await manager.files()
    log.trace(args, files)
    const infos = await throttle(files.map(file => () => manager.fileinfo(file)))
    infos.forEach(info => console.log(info))
    process.exit(0)
  },
}

export default ListCommand
