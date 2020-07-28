import os from 'os'
import PouchDB from 'pouchdb'
import Find from 'pouchdb-find'
import Upsert from 'pouchdb-upsert'

import { Lincoln } from '@nnode/lincoln'
import { FfprobeData } from 'fluent-ffmpeg'

import { MediaInfo } from './MediaInfo'

PouchDB.plugin(Find)
PouchDB.plugin(Upsert)

const COUCHDB_URL = process.env.PLEXIFY_COUCHDB_URL || 'http://couchdb.in.nativecode.com:5984/plexify'

export class MediaStore {
  readonly database: PouchDB.Database

  private readonly log: Lincoln

  constructor(logger: Lincoln) {
    this.database = new PouchDB(COUCHDB_URL, {
      adapter: 'http',
      auth: {
        password: process.env.PLEXIFY_COUCHDB_PASSWORD || '2bpi9AN0o1Q5ZcLs',
        username: process.env.PLEXIFY_COUCHDB_USERNAME || 'admin',
      },
      name: COUCHDB_URL,
    })
    this.log = logger.extend('storage')
  }

  async all(options?: PouchDB.Find.FindRequest<MediaInfo>) {
    const results = await this.database.find(options || { selector: {} })
    return results.docs
  }

  async exists(id: string) {
    try {
      const document = await this.database.get<MediaInfo>(id)
      return document._id === this.cleanid(id)
    } catch {
      return false
    }
  }

  get(id: string) {
    return this.database.get<MediaInfo>(this.cleanid(id))
  }

  lock(id: string, source: FfprobeData) {
    this.log.trace('locked', this.cleanid(id))
    return this.upsert(this.cleanid(id), source, true, os.hostname())
  }

  async locked(id: string) {
    try {
      const document = await this.database.get<MediaInfo>(this.cleanid(id))
      return document.locked === true && document.host !== os.hostname()
    } catch {
      return false
    }
  }

  unlock(id: string, source: FfprobeData) {
    this.log.trace('unlocked', this.cleanid(id))
    return this.upsert(this.cleanid(id), source, false, null)
  }

  upsert(id: string, source: FfprobeData, locked: boolean = false, host: string | null = null) {
    return this.database.upsert<MediaInfo>(this.cleanid(id), (target: MediaInfo) => {
      target.host = host
      target.locked = locked
      target.source = source
      return target
    })
  }

  private cleanid(id: string): string {
    return id.replace(/\s/g, '.')
  }
}
