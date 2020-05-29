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
    this.database = new PouchDB('http://couchdb.in.nativecode.com:5984/plexify', {
      adapter: 'http',
      auth: {
        password: process.env.PLEXIFY_COUCHDB_PASSWORD || '2bpi9AN0o1Q5ZcLs',
        username: process.env.PLEXIFY_COUCHDB_USERNAME || 'admin',
      },
      name: process.env.PLEXIFY_COUCHDB_URL || 'http://couchdb.in.nativecode.com:5984/plexify',
    })
    this.log = logger.extend('storage')
  }

  async exists(id: string) {
    try {
      const document = await this.database.get<MediaInfo>(id)
      return document._id === id
    } catch {
      return false
    }
  }

  get(id: string) {
    return this.database.get<MediaInfo>(id)
  }

  lock(id: string, source: FfprobeData) {
    this.log.trace('locked', id)
    return this.upsert(id, source, true, os.hostname())
  }

  async locked(id: string) {
    try {
      const document = await this.database.get<MediaInfo>(id)
      return document.locked === true && document.host !== os.hostname()
    } catch {
      return false
    }
  }

  unlock(id: string, source: FfprobeData) {
    this.log.trace('unlocked', id)
    return this.upsert(id, source, false, null)
  }

  upsert(id: string, source: FfprobeData, locked: boolean = false, host: string | null = null) {
    return this.database.upsert<MediaInfo>(id, (target: MediaInfo) => {
      target.host = host
      target.locked = locked
      target.source = source
      return target
    })
  }
}
