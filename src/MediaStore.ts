import os from 'os'
import md5 from 'md5'
import PouchDB from 'pouchdb'
import Find from 'pouchdb-find'
import Upsert from 'pouchdb-upsert'

import { BError } from 'berror'
import { fs } from '@nofrills/fs'
import { Lincoln } from '@nnode/lincoln'
import { FfprobeData } from 'fluent-ffmpeg'

import { MediaInfo } from './MediaInfo'

PouchDB.plugin(Find)
PouchDB.plugin(Upsert)

const COUCHDB_URL = process.env.PLEXIFY_COUCHDB_URL || 'http://localhost/plexify'

export class MediaStore {
  readonly database: PouchDB.Database<MediaInfo>

  private readonly log: Lincoln

  constructor(logger: Lincoln) {
    const options: PouchDB.Configuration.RemoteDatabaseConfiguration = {
      adapter: 'http',
      auth: {
        password: process.env.PLEXIFY_COUCHDB_PASSWORD || 'guest',
        username: process.env.PLEXIFY_COUCHDB_USERNAME || 'guest',
      },
      name: fs.basename(COUCHDB_URL),
    }

    this.database = new PouchDB<MediaInfo>(COUCHDB_URL, options)
    this.log = logger.extend('storage')
    this.log.trace('options', options)
  }

  async all(options?: PouchDB.Find.FindRequest<MediaInfo>) {
    try {
      const results = await this.database.find(options || { selector: {} })
      return results.docs
    } catch (error) {
      this.log.error(new BError('all', error), error)
      return []
    }
  }

  bulk(batch: MediaInfo[]) {
    return this.database.bulkDocs(batch)
  }

  dbinfo() {
    return this.database.info()
  }

  document(doc: Partial<MediaInfo>): MediaInfo {
    const document: MediaInfo = { ...doc, _id: this.cleanid(doc.filename!) } as MediaInfo
    return document
  }

  async exists(id: string) {
    try {
      const key = this.cleanid(id)
      const document = await this.database.get(key)
      const exists = document._id === key
      this.log.trace('exists', { id, docid: document._id, exists })
      return exists
    } catch (error) {
      this.log.error(new BError('exists', error), error)
      return false
    }
  }

  async get(id: string) {
    try {
      return await this.database.get(this.cleanid(id))
    } catch (error) {
      this.log.error(new BError('get', error), error)
      return null
    }
  }

  has(id: string, set: MediaInfo[]) {
    return set.map((x) => x._id).includes(this.cleanid(id))
  }

  async lock(id: string, source: FfprobeData) {
    try {
      const document = await this.get(this.cleanid(id))

      if (document) {
        document.host = os.hostname()
        document.locked = true
        document.source = source
        await this.upsert(document._id, document)
        this.log.trace('locked', { id, document })
      }
    } catch (error) {
      this.log.error(new BError('lock', error), error)
    }
  }

  async locked(id: string) {
    try {
      const document = await this.database.get(this.cleanid(id))
      return document.locked === true && document.host !== os.hostname()
    } catch (error) {
      this.log.error(new BError('locked', error), error)
      return false
    }
  }

  async unlock(id: string, source: FfprobeData) {
    try {
      const document = await this.get(this.cleanid(id))

      if (document) {
        document.host = null
        document.locked = false
        document.source = source
        await this.upsert(document._id, document)
        this.log.trace('unlocked', { id, document })
      }
    } catch (error) {
      this.log.error(new BError('unlock', error), error)
    }
  }

  async upsert(id: string, document: Partial<MediaInfo>) {
    const key = this.cleanid(id)

    const response = await this.database.upsert(key, (target: MediaInfo) => ({
      ...target,
      ...document,
    }))

    return response
  }

  private cleanid(id: string): string {
    if (id.startsWith('id-')) {
      return id
    }

    const hash = md5(this.fileident(id))
    this.log.trace('cleanid', { id, hash })
    return `id-${hash}`
  }

  private fileident(id: string) {
    if (id.startsWith('id-')) {
      return id
    }

    const ident = fs.basename(id, false)
    this.log.trace('fileident', { id, ident })
    return ident
  }
}
