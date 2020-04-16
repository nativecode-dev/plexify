import PouchDB from 'pouchdb'
import Upsert from 'pouchdb-upsert'
import { MediaInfo } from './MediaInfo'

PouchDB.plugin(Upsert)

export class MediaStore {
  readonly database: PouchDB.Database

  constructor() {
    this.database = new PouchDB('plexify')
  }

  upsert(source: MediaInfo) {
    return this.database.upsert<MediaInfo>(source._id, (target: MediaInfo) => {
      target.filename = source.filename
      target.source = source.source
      return target
    })
  }
}
