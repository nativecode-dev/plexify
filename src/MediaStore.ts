import os from 'os'
import PouchDB from 'pouchdb'
import Upsert from 'pouchdb-upsert'

import { Lincoln } from '@nnode/lincoln'
import { FfprobeData } from 'fluent-ffmpeg'

import { MediaInfo } from './MediaInfo'

PouchDB.plugin(Upsert)

export class MediaStore {
  readonly database: PouchDB.Database

  private readonly log: Lincoln

  constructor(logger: Lincoln) {
    this.database = new PouchDB('http://couchdb.in.nativecode.com', {
      auth: {
        password: '2bpi9AN0o1Q5ZcLs',
        username: 'admin',
      },
    })
    this.log = logger.extend('storage')
  }

  async exists(id: string) {
    const document = await this.database.get<MediaInfo>(id)
    return document._id === id
  }

  lock(id: string, filename: string, source: FfprobeData) {
    this.log.trace('locked', id, filename)
    return this.upsert(id, filename, source, true, os.hostname())
  }

  async locked(id: string) {
    const document = await this.database.get<MediaInfo>(id)
    return document.locked === true && document.host !== os.hostname()
  }

  unlock(id: string, filename: string, source: FfprobeData) {
    this.log.trace('unlocked', id, filename)
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
