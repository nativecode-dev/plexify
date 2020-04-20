export interface ConfigurationOptions {
  couchdb: {
    adapter: string
    auth: {
      login: string
      password: string
    }
    url: string
  }
}
