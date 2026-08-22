const { db } = require('../config/db');
const { trips, tripStops, tripStopActivities, activities, cities } = require('../db/schema');
const { eq, and, asc, sql } = require('drizzle-orm');

// Helper to verify that a trip belongs to the user
const verifyTripOwnership = async (tripId, userId) => {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);
  return trip;
};

// GET /api/v1/trips/:tripId/stops
const getStops = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    const stopsList = await db
      .select({
        id: tripStops.id,
        tripId: tripStops.tripId,
        cityId: tripStops.cityId,
        type: tripStops.type,
        title: tripStops.title,
        description: tripStops.description,
        startDate: tripStops.startDate,
        endDate: tripStops.endDate,
        budget: tripStops.budget,
        sortOrder: tripStops.sortOrder,
        createdAt: tripStops.createdAt,
        updatedAt: tripStops.updatedAt,
        cityName: cities.name,
        cityCountry: cities.country,
        cityImageUrl: cities.imageUrl,
      })
      .from(tripStops)
      .leftJoin(cities, eq(tripStops.cityId, cities.id))
      .where(eq(tripStops.tripId, tripId))
      .orderBy(asc(tripStops.sortOrder));

    // Fetch activities for all stops in this trip
    const stopsWithActivities = await Promise.all(
      stopsList.map(async (stop) => {
        const stopActs = await db
          .select({
            id: tripStopActivities.id,
            tripStopId: tripStopActivities.tripStopId,
            activityId: tripStopActivities.activityId,
            scheduledDate: tripStopActivities.scheduledDate,
            scheduledTime: tripStopActivities.scheduledTime,
            costOverride: tripStopActivities.costOverride,
            sortOrder: tripStopActivities.sortOrder,
            activityName: activities.name,
            activityCategory: activities.category,
            activityDescription: activities.description,
            estimatedCost: activities.estimatedCost,
            estimatedDurationMinutes: activities.estimatedDurationMinutes,
            activityImageUrl: activities.imageUrl,
          })
          .from(tripStopActivities)
          .leftJoin(activities, eq(tripStopActivities.activityId, activities.id))
          .where(eq(tripStopActivities.tripStopId, stop.id))
          .orderBy(asc(tripStopActivities.sortOrder));

        return {
          ...stop,
          activities: stopActs.map(a => ({
            id: a.id,
            activityId: a.activityId,
            name: a.activityName,
            category: a.activityCategory,
            description: a.activityDescription,
            scheduledDate: a.scheduledDate,
            scheduledTime: a.scheduledTime,
            cost: a.costOverride !== null ? a.costOverride : a.estimatedCost,
            duration: a.estimatedDurationMinutes,
            imageUrl: a.activityImageUrl,
          }))
        };
      })
    );

    return res.status(200).json({ data: stopsWithActivities });
  } catch (err) {
    console.error('Error fetching stops:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stops.' }
    });
  }
};

// POST /api/v1/trips/:tripId/stops
const createStop = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;
    const { cityId, type = 'city_stop', title, description, startDate, endDate, budget } = req.body;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    if (!title || !startDate || !endDate) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Stop title, start date, and end date are required.' }
      });
    }

    // Determine next sort order
    const [lastStop] = await db
      .select({ maxOrder: sql`COALESCE(MAX(${tripStops.sortOrder}), -1)` })
      .from(tripStops)
      .where(eq(tripStops.tripId, tripId));

    const nextSortOrder = (parseInt(lastStop?.maxOrder, 10) || -1) + 1;

    const [newStop] = await db
      .insert(tripStops)
      .values({
        tripId,
        cityId: cityId || null,
        type,
        title: title.trim(),
        description: description ? description.trim() : null,
        startDate,
        endDate,
        budget: budget ? String(budget) : null,
        sortOrder: nextSortOrder,
      })
      .returning();

    // Attach city details if present
    let cityDetails = null;
    if (newStop.cityId) {
      const [c] = await db.select().from(cities).where(eq(cities.id, newStop.cityId)).limit(1);
      cityDetails = c;
    }

    return res.status(201).json({
      data: {
        ...newStop,
        cityName: cityDetails?.name || null,
        cityCountry: cityDetails?.country || null,
        activities: [],
      }
    });
  } catch (err) {
    console.error('Error creating stop:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create stop.' }
    });
  }
};

// PUT /api/v1/trips/:tripId/stops/:stopId
const updateStop = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId, stopId } = req.params;
    const { cityId, type, title, description, startDate, endDate, budget } = req.body;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    const [existingStop] = await db
      .select()
      .from(tripStops)
      .where(and(eq(tripStops.id, stopId), eq(tripStops.tripId, tripId)))
      .limit(1);

    if (!existingStop) {
      return res.status(404).json({
        error: { code: 'STOP_NOT_FOUND', message: 'Stop not found.' }
      });
    }

    const updates = { updatedAt: new Date() };
    if (cityId !== undefined) updates.cityId = cityId || null;
    if (type !== undefined) updates.type = type;
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (budget !== undefined) updates.budget = budget ? String(budget) : null;

    const [updated] = await db
      .update(tripStops)
      .set(updates)
      .where(eq(tripStops.id, stopId))
      .returning();

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error('Error updating stop:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update stop.' }
    });
  }
};

// DELETE /api/v1/trips/:tripId/stops/:stopId
const deleteStop = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId, stopId } = req.params;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    await db.delete(tripStops).where(and(eq(tripStops.id, stopId), eq(tripStops.tripId, tripId)));
    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting stop:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete stop.' }
    });
  }
};

// PATCH /api/v1/trips/:tripId/stops/reorder
const reorderStops = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;
    const { orderedStopIds } = req.body;

    if (!Array.isArray(orderedStopIds)) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'orderedStopIds array is required.' }
      });
    }

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    for (let i = 0; i < orderedStopIds.length; i++) {
      await db
        .update(tripStops)
        .set({ sortOrder: i })
        .where(and(eq(tripStops.id, orderedStopIds[i]), eq(tripStops.tripId, tripId)));
    }

    return res.status(200).json({ data: { message: 'Order updated' } });
  } catch (err) {
    console.error('Error reordering stops:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder stops.' }
    });
  }
};

// GET /api/v1/trips/:tripId/itinerary
const getItinerary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    // Fetch all stops
    const stopsList = await db
      .select({
        id: tripStops.id,
        title: tripStops.title,
        startDate: tripStops.startDate,
        endDate: tripStops.endDate,
        budget: tripStops.budget,
        type: tripStops.type,
        cityName: cities.name,
        cityCountry: cities.country,
      })
      .from(tripStops)
      .leftJoin(cities, eq(tripStops.cityId, cities.id))
      .where(eq(tripStops.tripId, tripId))
      .orderBy(asc(tripStops.sortOrder));

    // Fetch all activities
    const allActivities = await db
      .select({
        id: tripStopActivities.id,
        tripStopId: tripStopActivities.tripStopId,
        activityId: tripStopActivities.activityId,
        scheduledDate: tripStopActivities.scheduledDate,
        scheduledTime: tripStopActivities.scheduledTime,
        costOverride: tripStopActivities.costOverride,
        name: activities.name,
        category: activities.category,
        estimatedCost: activities.estimatedCost,
      })
      .from(tripStopActivities)
      .innerJoin(tripStops, eq(tripStopActivities.tripStopId, tripStops.id))
      .leftJoin(activities, eq(tripStopActivities.activityId, activities.id))
      .where(eq(tripStops.tripId, tripId))
      .orderBy(asc(tripStopActivities.sortOrder));

    // Generate day-by-day structure between trip start and end date
    const days = [];
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const dayCount = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    for (let i = 0; i < dayCount; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];

      // Find active stop for this day
      const activeStop = stopsList.find(s => {
        const sStart = new Date(s.startDate);
        const sEnd = new Date(s.endDate);
        return current >= sStart && current <= sEnd;
      }) || stopsList[0] || null;

      // Filter activities for this date
      const dayActivities = allActivities
        .filter(a => {
          if (a.scheduledDate) return a.scheduledDate === dateStr;
          return a.tripStopId === activeStop?.id;
        })
        .map(a => ({
          id: a.id,
          activityId: a.activityId,
          name: a.name,
          category: a.category,
          scheduledTime: a.scheduledTime ? a.scheduledTime.slice(0, 5) : '09:00',
          cost: parseFloat(a.costOverride !== null ? a.costOverride : a.estimatedCost) || 0,
        }));

      const dailyCost = dayActivities.reduce((sum, act) => sum + act.cost, 0);

      days.push({
        dayNumber: i + 1,
        date: dateStr,
        stopId: activeStop?.id || null,
        stopTitle: activeStop?.title || (activeStop?.cityName ? `Visit ${activeStop.cityName}` : `Day ${i + 1}`),
        cityName: activeStop?.cityName || activeStop?.title || 'Main Destination',
        cityCountry: activeStop?.cityCountry || null,
        activities: dayActivities,
        dailyCost,
      });
    }

    return res.status(200).json({
      data: {
        tripId: trip.id,
        tripName: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalBudget: trip.totalBudget,
        days,
        stops: stopsList,
      }
    });
  } catch (err) {
    console.error('Error generating itinerary view:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to assemble itinerary.' }
    });
  }
};

module.exports = {
  getStops,
  createStop,
  updateStop,
  deleteStop,
  reorderStops,
  getItinerary,
};
