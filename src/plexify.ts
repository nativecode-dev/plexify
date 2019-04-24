import { Logger } from './Logging'
import { DefaultMediaInfoOptions } from './MediaInfo/MediaInfo'
import { DefaultHandbrakeOptions } from './Handbrake/Handbrake'
import { VideoManagerOptions } from './VideoManager/VideoManagerOptions'
import { VideoManager, DefaultVideoManagerOptions } from './VideoManager/VideoManager'

async function main() {
  const dryRun = process.env.PLEXIFY_DRYRUN === 'true'

  const options: VideoManagerOptions = {
    ...DefaultVideoManagerOptions,
    ...{
      datastore: {
        host: process.env.PLEXIFY_REDIS_HOST || 'localhost',
        port: parseInt(process.env.PLEXIFY_REDIS_PORT || '6379', 0),
      },
      paths: [process.env.PLEXIFY_MOUNT || '/mnt/media'],
      rename: process.env.PLEXIFY_RENAME === 'true',
      handbrake: { ...DefaultHandbrakeOptions },
      mediainfo: { ...DefaultMediaInfoOptions },
    },
  }

  Logger.debug(options)

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  while (true) {
    const manager = new VideoManager(options)
    const files = await manager.find()
    const scans = await manager.scan(files)

    if (dryRun === false) {
      Logger.info('encoding')
      await manager.encode(scans.map(scan => scan.video))
    }

    await sleep(5 * (1000 * 60))
  }
}

main().catch(console.log)
