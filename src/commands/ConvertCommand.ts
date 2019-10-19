import { CommandModule, Argv, Arguments, PositionalOptions, Options } from 'yargs'

import Logger from '../Logger'

import { ConvertOptions } from './options/ConvertOptions'
import { GlobalOptions } from './options/GlobalOptions'

export type ConvertCommandOptions = {} | ConvertOptions & GlobalOptions

const log = Logger.extend('command:convert')

const ConvertCommand: CommandModule<{}, ConvertCommandOptions> = {
  command: 'convert <path> [options]',
  describe: 'convert the files found in <path> in-place',
  builder: {},

  handler: async (args: Arguments<ConvertCommandOptions>) => {
    log.trace(args)
  },
}

export default ConvertCommand
