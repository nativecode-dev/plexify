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
    return this.upsert(id, filename, source, true, os.hostname())
  }

  async locked(id: string) {
    const document = await this.database.get<MediaInfo>(id)
    return document.locked === true && document.host !== os.hostname()
  }

  unlock(id: string, filename: string, source: FfprobeData) {
    return this.upsert(id, filename, source, false, null)
  }

  upsert(id: string, filename: string, source: FfprobeData, locked: boolean = false, host: string | null = null) {
    return this.database.upsert<MediaInfo>(id, (target: MediaInfo) => {
      target.filename = filename
      target.host = host
      target.locked = locked
      target.source = source
      return target
    })
  }
}
