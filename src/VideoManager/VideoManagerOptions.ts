import { HandbrakeOptions } from 'handbrake-js'
import { MediaInfoOptions } from '../MediaInfo/MediaInfoOptions'
import { DataStoreOptions } from '../DataStore/DataStoreOptions'

export interface VideoManagerOptions {
  extensions: string[]
  paths: string[]
  rename: boolean

  datastore: DataStoreOptions
  handbrake: HandbrakeOptions
  mediainfo: MediaInfoOptions
}
