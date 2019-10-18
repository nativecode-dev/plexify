import deepmerge from 'deepmerge'

import CreateDataStore from './CreateDataStore'

import { Video } from './Video'

export class VideoCollection {
  private readonly datastore: PouchDB.Database<Video>

  constructor() {
    this.datastore = CreateDataStore({
      name: 'videos',
      values: {
        adapter: 'memory',
        name: 'videos',
      },
    })
  }

  get(filename: string): Promise<Video> {
    return this.datastore.get(filename)
  }

  async lock(filename: string, owner: string): Promise<boolean> {
    const update: Partial<Video> = {
      audit: {
        modified: Date.now(),
      },
      filename: filename,
      lock: {
        owner,
        locked: Date.now(),
      },
    }

    const response = await this.datastore.upsert(filename, doc => this.differ([doc, update]))
    return response.updated
  }

  async list(): Promise<Video[]> {
    const response = await this.datastore.find({ selector: {} })
    return response.docs
  }

  async remove(filename: string): Promise<boolean> {
    const video = await this.datastore.get(filename)
    const response = await this.datastore.remove(video)
    return response.ok
  }

  async unlock(filename: string): Promise<boolean> {
    const update: Partial<Video> = {
      audit: {
        modified: Date.now(),
      },
      lock: undefined,
    }

    const response = await this.datastore.upsert(filename, () => this.differ([update]))
    return response.updated
  }

  async upsert(filename: string): Promise<boolean> {
    const update: Partial<Video> = {
      audit: {
        created: Date.now(),
      },
      filename,
    }

    const response = await this.datastore.upsert(filename, () => this.differ([update]))
    return response.updated
  }

  private differ = (
    videos: Partial<PouchDB.Core.Document<Video>>[],
  ): Video & Partial<PouchDB.Core.IdMeta> | PouchDB.CancelUpsert => {
    return deepmerge.all<Video>(videos, { clone: true })
  }
}
