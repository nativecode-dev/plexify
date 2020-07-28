import { fs } from '@nofrills/fs'

import { ConfigurationOptions } from './Options/ConfigurationOptions'

const DefaultConfigurationOptions: ConfigurationOptions = {
  couchdb: {
    adapter: process.env.PLEXIFY_COUCHDB_ADAPTER || 'http',
    auth: {
      login: process.env.PLEXIFY_COUCHDB_LOGIN || 'admin',
      password: process.env.PLEXIFY_COUCHDB_PASSWORD || '',
    },
    url: process.env.PLEXIFY_COUCHDB_HOST || 'http://localhost',
  },
}

export class Configuration {
  private readonly configpath: string

  constructor(path: string = process.env.HOME || process.cwd(), name: string) {
    this.configpath = fs.join(path, name)
  }

  async load<T extends ConfigurationOptions>(): Promise<T> {
    if (await fs.exists(this.configpath)) {
      return fs.json<T>(this.configpath)
    }

    return DefaultConfigurationOptions as T
  }

  async save<T extends ConfigurationOptions>(configuration: T): Promise<void> {
    await fs.save(this.configpath, configuration)
  }
}
