const { db } = require('../config/db');
const { activities, tripStops, tripStopActivities, trips, cities } = require('../db/schema');
const { eq, and, ilike, lte, asc, desc, sql } = require('drizzle-orm');

// Helper to verify stop belongs to user via trip
const verifyStopOwnership = async (tripId, stopId, userId) => {
  const [stop] = await db
    .select({ stopId: tripStops.id })
    .from(tripStops)
    .innerJoin(trips, eq(tripStops.tripId, trips.id))
    .where(and(eq(tripStops.id, stopId), eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);
  return !!stop;
};

// GET /api/v1/activities & /api/activities (Public catalog search)
const getActivities = async (req, res) => {
  try {
    const { cityId, category, maxCost, search, sort = 'name:asc', page = 1, pageSize = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const offsetNum = (pageNum - 1) * limitNum;

    const conditions = [];

    if (cityId) {
      conditions.push(eq(activities.cityId, cityId));
    }

    if (category && ['sightseeing', 'food', 'adventure', 'culture', 'nightlife', 'relaxation', 'other'].includes(category)) {
      conditions.push(eq(activities.category, category));
    }

    if (maxCost && !isNaN(parseFloat(maxCost))) {
      conditions.push(lte(activities.estimatedCost, String(maxCost)));
    }

    if (search && search.trim()) {
      conditions.push(ilike(activities.name, `%${search.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByClause = asc(activities.name);
    if (sort) {
      const [field, direction] = sort.split(':');
      const isAsc = direction === 'asc';
      if (field === 'estimatedCost') orderByClause = isAsc ? asc(activities.estimatedCost) : desc(activities.estimatedCost);
      else if (field === 'name') orderByClause = isAsc ? asc(activities.name) : desc(activities.name);
      else if (field === 'duration') orderByClause = isAsc ? asc(activities.estimatedDurationMinutes) : desc(activities.estimatedDurationMinutes);
    }

    const activityList = await db
      .select({
        id: activities.id,
        cityId: activities.cityId,
        name: activities.name,
        description: activities.description,
        category: activities.category,
        estimatedCost: activities.estimatedCost,
        estimatedDurationMinutes: activities.estimatedDurationMinutes,
        imageUrl: activities.imageUrl,
        cityName: cities.name,
        cityCountry: cities.country,
      })
      .from(activities)
      .leftJoin(cities, eq(activities.cityId, cities.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offsetNum);

    const [countResult] = await db
      .select({ total: sql`count(*)` })
      .from(activities)
      .where(whereClause);

    const total = parseInt(countResult?.total || 0, 10);
    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      data: activityList,
      meta: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages,
      }
    });
  } catch (err) {
    console.error('Error fetching activities:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to search activities.' }
    });
  }
};

// GET /api/v1/trips/:tripId/stops/:stopId/activities
const getStopActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId, stopId } = req.params;

    const isOwner = await verifyStopOwnership(tripId, stopId, userId);
    if (!isOwner) {
      return res.status(404).json({
        error: { code: 'STOP_NOT_FOUND', message: 'Stop not found or unauthorized.' }
      });
    }

    const stopActs = await db
      .select({
        id: tripStopActivities.id,
        tripStopId: tripStopActivities.tripStopId,
        activityId: tripStopActivities.activityId,
        scheduledDate: tripStopActivities.scheduledDate,
        scheduledTime: tripStopActivities.scheduledTime,
        costOverride: tripStopActivities.costOverride,
        sortOrder: tripStopActivities.sortOrder,
        name: activities.name,
        description: activities.description,
        category: activities.category,
        estimatedCost: activities.estimatedCost,
        estimatedDurationMinutes: activities.estimatedDurationMinutes,
        imageUrl: activities.imageUrl,
      })
      .from(tripStopActivities)
      .leftJoin(activities, eq(tripStopActivities.activityId, activities.id))
      .where(eq(tripStopActivities.tripStopId, stopId))
      .orderBy(asc(tripStopActivities.sortOrder));

    return res.status(200).json({
      data: stopActs.map(a => ({
        id: a.id,
        activityId: a.activityId,
        name: a.name,
        description: a.description,
        category: a.category,
        scheduledDate: a.scheduledDate,
        scheduledTime: a.scheduledTime,
        cost: a.costOverride !== null ? a.costOverride : a.estimatedCost,
        duration: a.estimatedDurationMinutes,
        imageUrl: a.imageUrl,
      }))
    });
  } catch (err) {
    console.error('Error fetching stop activities:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stop activities.' }
    });
  }
};

// POST /api/v1/trips/:tripId/stops/:stopId/activities
const addStopActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId, stopId } = req.params;
    const { activityId, scheduledDate, scheduledTime, costOverride } = req.body;

    if (!activityId) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'activityId is required.' }
      });
    }

    const isOwner = await verifyStopOwnership(tripId, stopId, userId);
    if (!isOwner) {
      return res.status(404).json({
        error: { code: 'STOP_NOT_FOUND', message: 'Stop not found or unauthorized.' }
      });
    }

    // Check duplicate
    const [existing] = await db
      .select()
      .from(tripStopActivities)
      .where(and(eq(tripStopActivities.tripStopId, stopId), eq(tripStopActivities.activityId, activityId)))
      .limit(1);

    if (existing) {
      return res.status(409).json({
        error: { code: 'ACTIVITY_ALREADY_ADDED', message: 'This activity is already added to this stop.' }
      });
    }

    // Next sort order
    const [lastAct] = await db
      .select({ maxOrder: sql`COALESCE(MAX(${tripStopActivities.sortOrder}), -1)` })
      .from(tripStopActivities)
      .where(eq(tripStopActivities.tripStopId, stopId));

    const nextSortOrder = (parseInt(lastAct?.maxOrder, 10) || -1) + 1;

    const [created] = await db
      .insert(tripStopActivities)
      .values({
        tripStopId: stopId,
        activityId,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        costOverride: costOverride !== undefined && costOverride !== null ? String(costOverride) : null,
        sortOrder: nextSortOrder,
      })
      .returning();

    // Fetch activity details
    const [act] = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);

    return res.status(201).json({
      data: {
        id: created.id,
        activityId: created.activityId,
        name: act?.name || 'Activity',
        category: act?.category || 'other',
        scheduledDate: created.scheduledDate,
        scheduledTime: created.scheduledTime,
        cost: created.costOverride !== null ? created.costOverride : (act?.estimatedCost || '0'),
      }
    });
  } catch (err) {
    console.error('Error assigning activity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to assign activity.' }
    });
  }
};

// DELETE /api/v1/trips/:tripId/stops/:stopId/activities/:activityId
const removeStopActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId, stopId, activityId } = req.params;

    const isOwner = await verifyStopOwnership(tripId, stopId, userId);
    if (!isOwner) {
      return res.status(404).json({
        error: { code: 'STOP_NOT_FOUND', message: 'Stop not found or unauthorized.' }
      });
    }

    // Delete by join ID or by activityId
    await db
      .delete(tripStopActivities)
      .where(
        and(
          eq(tripStopActivities.tripStopId, stopId),
          sql`(${tripStopActivities.activityId} = ${activityId} OR ${tripStopActivities.id} = ${activityId})`
        )
      );

    return res.status(204).send();
  } catch (err) {
    console.error('Error removing activity:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove activity.' }
    });
  }
};

module.exports = {
  getActivities,
  getStopActivities,
  addStopActivity,
  removeStopActivity,
};
