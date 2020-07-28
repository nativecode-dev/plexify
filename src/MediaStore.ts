import os from 'os'
import PouchDB from 'pouchdb'
import Find from 'pouchdb-find'
import Upsert from 'pouchdb-upsert'

import { Lincoln } from '@nnode/lincoln'
import { FfprobeData } from 'fluent-ffmpeg'

import { MediaInfo } from './MediaInfo'

PouchDB.plugin(Find)
PouchDB.plugin(Upsert)

const COUCHDB_URL = process.env.PLEXIFY_COUCHDB_URL || 'http://localhost/plexify'

export class MediaStore {
  readonly database: PouchDB.Database

  private readonly log: Lincoln

  constructor(logger: Lincoln) {
    const options = {
      adapter: 'http',
      auth: {
        password: process.env.PLEXIFY_COUCHDB_PASSWORD || 'guest',
        username: process.env.PLEXIFY_COUCHDB_USERNAME || 'guest',
      },
      name: COUCHDB_URL,
    }

    this.database = new PouchDB(COUCHDB_URL, options)
    this.log = logger.extend('storage')
    this.log.trace(options)
  }

  async all(options?: PouchDB.Find.FindRequest<MediaInfo>) {
    try {
      const results = await this.database.find(options || { selector: {} })
      return results.docs
    } catch (error) {
      this.log.error(error)
      return []
    }
  }

  async exists(id: string) {
    try {
      const document = await this.database.get<MediaInfo>(id)
      return document._id === this.cleanid(id)
    } catch (error) {
      this.log.error(error)
      return false
    }
  }

  async get(id: string) {
    try {
      return await this.database.get<MediaInfo>(this.cleanid(id))
    } catch (error) {
      this.log.error(error)
      return null
    }
  }

  async lock(id: string, source: FfprobeData) {
    try {
      this.log.trace('locked', this.cleanid(id))
      return await this.upsert(this.cleanid(id), source, true, os.hostname())
    } catch (error) {
      this.log.error(error)
    }
  }

  async locked(id: string) {
    try {
      const document = await this.database.get<MediaInfo>(this.cleanid(id))
      return document.locked === true && document.host !== os.hostname()
    } catch (error) {
      this.log.error(error)
      return false
    }
  }

  async unlock(id: string, source: FfprobeData) {
    try {
      this.log.trace('unlocked', this.cleanid(id))
      return await this.upsert(this.cleanid(id), source, false, null)
    } catch (error) {
      this.log.error(error)
    }
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
