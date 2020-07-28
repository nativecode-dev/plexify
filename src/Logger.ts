import { createLogger, createAwsTransformer, createScrubTransformer, createUriTransformer } from '@nnode/lincoln'
import { LincolnLogDebug } from '@nnode/lincoln-debug'

const logger = createLogger('plexify')
logger.interceptors([createAwsTransformer, createScrubTransformer(['password']), createUriTransformer])
LincolnLogDebug.observe(logger)

export const Logger = logger
