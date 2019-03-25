import { MediaInfo } from './MediaInfo/MediaInfo'

async function main() {
  const mediainfo = new MediaInfo()
  const results = await mediainfo.videoProfileFormat('/home/mpham/Downloads/SampleVideo_1280x720_30mb.mp4')
  console.log(results)
}

main().catch(console.log)
