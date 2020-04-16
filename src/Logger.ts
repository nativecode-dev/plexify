import { createLogger } from '@nnode/lincoln'
import { LincolnLogDebug } from '@nnode/lincoln-debug'

const logger = createLogger('plexify')
const renderer = new LincolnLogDebug(logger)

export const Logger = logger
