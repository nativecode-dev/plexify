import { CreateLogger, CreateOptions, Lincoln } from '@nofrills/lincoln-debug'

const options = CreateOptions('plexify')
export const Logger: Lincoln = CreateLogger(options)
