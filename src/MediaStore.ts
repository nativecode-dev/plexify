import PouchDB from 'pouchdb'
import Upsert from 'pouchdb-upsert'

PouchDB.plugin(Upsert)

export class MediaStore {
  readonly database: PouchDB.Database

  constructor() {
    this.database = new PouchDB('plexify')
  }
}
