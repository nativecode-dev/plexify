import { MediaInfoGeneral } from './MediaInfoGeneral'
import { MediaInfoVideo } from './MediaInfoVideo'
import { MediaInfoAudio } from './MediaInfoAudio'

export interface MediaInfo {
  general: MediaInfoGeneral
  video: MediaInfoVideo[]
  audio: MediaInfoAudio[]
}
