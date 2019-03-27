import { MediaInfo } from './MediaInfo/MediaInfo'
import { VideoManager } from './VideoManager/VideoManager'

async function main() {
  const manager = new VideoManager({
    paths: ['/home/mpham/Downloads/samples'],
  })
  const files = await manager.find()
  const scans = await manager.scan(files)
  const encoded = await manager.encode(files)
  console.log(...encoded)
}

main().catch(console.log)
