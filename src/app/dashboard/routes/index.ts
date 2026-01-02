/**
 * Route aggregator - combines all dashboard routes
 */

import {Router} from 'express';
import type {DatabaseAdapter} from '../../../infrastructure/database/types.js';
import {createRunsRoutes} from './runs.js';
import {createCallsRoutes} from './calls.js';
import {createStatsRoutes} from './stats.js';
import {createReplayRoutes, type ReplayContext} from './replay.js';

export type {ReplayContext} from './replay.js';

export function createDashboardRoutes(
	db: DatabaseAdapter,
	getReplayContext?: () => ReplayContext | null
): Router {
	const router = Router();

	// Mount route handlers
	router.use('/runs', createRunsRoutes(db));
	router.use('/calls', createCallsRoutes(db));
	router.use('/stats', createStatsRoutes(db));

	// Replay routes require proxy context
	if (getReplayContext) {
		router.use('/', createReplayRoutes(db, getReplayContext));
	}

	return router;
}

