import { VideoInfo } from './VideoInfo'

export interface VideoQueue {
  queued: boolean
  video: VideoInfo
}
