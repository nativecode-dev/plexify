import { createLogger } from '@nnode/lincoln'
import { LincolnLogDebug } from '@nnode/lincoln-debug'

const logger = createLogger('plexify')
LincolnLogDebug.observe(logger)

export const Logger = logger
