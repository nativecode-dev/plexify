import PouchDB from 'pouchdb'
import Find from 'pouchdb-find'
import Upsert from 'pouchdb-upsert'
import Http from 'pouchdb-adapter-http'
import Memory from 'pouchdb-adapter-memory'

export interface DataStoreOptions {
  name: string
  values: PouchDB.Configuration.LocalDatabaseConfiguration | PouchDB.Configuration.RemoteDatabaseConfiguration
}

export default function<T extends {}>(options: DataStoreOptions): PouchDB.Database<T> {
  PouchDB.plugin(Find)
  PouchDB.plugin(Upsert)
  PouchDB.plugin(Http)
  PouchDB.plugin(Memory)

  return new PouchDB<T>(options.name, options.values)
}
