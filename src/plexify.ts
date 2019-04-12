import program from 'commander'
import { fs } from '@nofrills/fs'

import { Logger } from './Logging'
import { DefaultMediaInfoOptions } from './MediaInfo/MediaInfo'
import { DefaultHandbrakeOptions } from './Handbrake/Handbrake'
import { VideoManagerOptions } from './VideoManager/VideoManagerOptions'
import { VideoManager, DefaultVideoManagerOptions } from './VideoManager/VideoManager'

interface Package {
  version: string
}

async function main() {
  const npm = await fs.json<Package>('package.json')

  const args = program
    .version(npm.version)
    .option('--path', 'location of media files', '/mnt/media')
    .option('--rename', 'rename after conversion', process.env.PLEXIFY_RENAME || false)
    .option('--dry-run', 'performs dry run', process.env.PLEXIFY_DRYRUN || true)
    .option('--db-host', 'redis database host', process.env.PLEXIFY_REDIS_HOST || 'localhost')
    .option('--db-port', 'redis database port', process.env.PLEXIFY_REDIS_PORT || '6379')
    .parse(process.argv)

  Logger.debug(args)

  const options: VideoManagerOptions = {
    ...DefaultVideoManagerOptions,
    ...{
      datastore: {
        host: args.dbHost,
        port: parseInt(args.dbPort, 0),
      },
      paths: [args.path],
      rename: args.rename,
      handbrake: { ...DefaultHandbrakeOptions },
      mediainfo: { ...DefaultMediaInfoOptions },
    },
  }

  Logger.debug(options)

  const manager = new VideoManager(options)
  const files = await manager.find()
  const scans = await manager.scan(files)

  if (program.dryRun === false) {
    Logger.info('encoding')
    await manager.encode(scans)
  }

  process.exit()
}

main().catch(console.log)
