export const PlexifyDelete: boolean = process.env.PLEXIFY_DELETE === 'false' ? false : true
export const PlexifyDryRun: boolean = process.env.PLEXIFY_DRYRUN === 'false' ? false : true
export const PlexifyMountPoint: string = process.env.PLEXIFY_MOUNT_POINT || '/mnt/media'
export const PlexifyPreset: string = process.env.PLEXIFY_PRESET || 'Fast 1080p30'

export const PlexifyRedisHost: string = process.env.PLEXIFY_REDIS_HOST || 'redis'
export const PlexifyRedisPort: number = process.env.PLEXIFY_REDIS_PORT
  ? parseInt(process.env.PLEXIFY_REDIS_PORT, 0)
  : 6379
