import os from 'os'
import PouchDB from 'pouchdb'
import Upsert from 'pouchdb-upsert'

import { MediaInfo } from './MediaInfo'
import { FfprobeData } from 'fluent-ffmpeg'

PouchDB.plugin(Upsert)

export class MediaStore {
  readonly database: PouchDB.Database

  constructor() {
    this.database = new PouchDB('plexify')
  }

  lock(id: string, filename: string, source: FfprobeData) {
    return this.upsert({ _id: id, host: os.hostname(), locked: true, filename, source })
  }

  async locked(id: string) {
    const document = await this.database.get<MediaInfo>(id)
    return document.locked === true && document.host !== os.hostname()
  }

  unlock(id: string, filename: string, source: FfprobeData) {
    return this.upsert({ _id: id, host: null, locked: false, filename, source })
  }

  upsert(source: MediaInfo) {
    return this.database.upsert<MediaInfo>(source._id, (target: MediaInfo) => {
      target.filename = source.filename
      target.source = source.source
      return target
    })
  }
}
