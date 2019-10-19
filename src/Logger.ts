import { CreateLogger, CreateOptions } from '@nofrills/lincoln-debug'
import { ScrubsInterceptor } from '@nofrills/scrubs'

const options = CreateOptions('plexify', undefined, [['scrubs', ScrubsInterceptor]])
const logger = CreateLogger(options)

export default logger
