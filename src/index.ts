import yargs from 'yargs'

import { ConvertCommand } from './Commands/ConvertCommand'
import { InfoCommand } from './Commands/InfoCommand'
import { ScanCommand } from './Commands/ScanCommand'

const args = yargs.scriptName('plexify').command(new ConvertCommand()).command(new InfoCommand()).command(new ScanCommand()).parse()
console.debug(args)
