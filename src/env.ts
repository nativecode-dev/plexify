export const PlexifyMountPoint: string = process.env.PLEXIFY_MOUNT_POINT || '/mnt/media'
export const PlexifyPreset: string = process.env.PLEXIFY_PRESET || 'Fast 1080p30'
export const PlexifyDryRun: boolean = process.env.PLEXIFY_DRYRUN === 'false' ? false : false
export const PlexifyRedis: string = process.env.PLEXIFY_REDIS_HOST || 'redis'
