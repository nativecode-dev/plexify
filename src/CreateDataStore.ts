import PouchDB from 'pouchdb'

export interface DataStoreOptions {
  name: string
  values: PouchDB.Configuration.LocalDatabaseConfiguration | PouchDB.Configuration.RemoteDatabaseConfiguration
}

export default function<T extends {}>(options: DataStoreOptions): PouchDB.Database<T> {
  return new PouchDB<T>(options.name, options.values)
}
