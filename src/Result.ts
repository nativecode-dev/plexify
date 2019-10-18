import { Video } from './Video'

export enum VideoStates {
  Converted = 'CONVERTED',
  Converting = 'CONVERTING',
  Failed = 'FAILED',
}

export type VideoState = VideoStates.Converted | VideoStates.Converting | VideoStates.Failed

export interface Result {
  state: VideoState
  video: Video
}
