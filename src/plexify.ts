import parseArgs from 'minimist'
import { Is } from '@nofrills/types'

import { Logger } from './Logging'
import { DefaultHandbrakeOptions } from './Handbrake/Handbrake'
import { DefaultDataStoreOptions } from './DataStore/DataStore'
import { VideoManagerOptions } from './VideoManager/VideoManagerOptions'
import { DefaultVideoManagerOptions, VideoManager } from './VideoManager/VideoManager'

function argArray(arg?: string | string[], defaults?: string[]): undefined | string[] {
  if (Is.array(arg)) {
    return arg as string[]
  }

  if (arg) {
    return [arg as string]
  }

  if (defaults) {
    return defaults
  }

  return undefined
}

function argNumber(arg?: string, defaultValue?: number): number | undefined {
  if (arg) {
    return parseInt(arg, undefined)
  }

  if (defaultValue) {
    return defaultValue
  }

  return undefined
}

function argString(arg?: string, defaultValue?: string): string | undefined {
  if (arg) {
    return arg
  }

  if (defaultValue) {
    return defaultValue
  }

  return undefined
}

function argSwitch(arg?: string, defaultSwitch?: boolean): boolean {
  if (arg) {
    return true
  }

  if (defaultSwitch) {
    return defaultSwitch
  }

  return false
}

async function main() {
  const args = parseArgs(process.argv)
  const options: Partial<VideoManagerOptions> = {
    ...{
      ...DefaultVideoManagerOptions,
      datastore: {
        ...DefaultDataStoreOptions,
      },
      handbrake: {
        ...DefaultHandbrakeOptions,
      },
    },
    ...{
      extensions: argArray(args.extension, DefaultVideoManagerOptions.extensions),
      paths: argArray(args.path),
      rename: argSwitch(args.rename, false),
      datastore: {
        host: argString(args.host, DefaultDataStoreOptions.host) as string,
        port: argNumber(args.port, DefaultDataStoreOptions.port) as number,
      },
    },
  }

  if (!options.paths || options.paths.length === 0) {
    throw Error('--path required')
  }

  const manager = new VideoManager(options)
  const files = await manager.find()
  const scans = await manager.scan(files)

  if (argSwitch('--dry-run', false)) {
    // await manager.encode(scans)
  }

  process.exit()
}

main().catch(console.log)
