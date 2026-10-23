import type { Endpoint } from 'payload'

import { getProgress } from '../services/progress.js'
import { lmsHandler } from './handler.js'

export const fetchProgressHandler = (_args?: Record<string, unknown>): Endpoint['handler'] =>
  lmsHandler(async ({ req, userId }) => Response.json(await getProgress({ req, userId })))
