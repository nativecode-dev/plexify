import { Lincoln } from '@nofrills/lincoln'
import { CreateLogger, CreateOptions } from '@nofrills/lincoln-debug'

const options = CreateOptions('plexify')
export const Logger: Lincoln = CreateLogger(options)
