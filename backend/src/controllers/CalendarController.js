const { db } = require('../config/db');
const { trips, tripStops, tripStopActivities, activities, cities } = require('../db/schema');
const { eq, and, asc } = require('drizzle-orm');

// GET /api/v1/trips/:tripId/calendar
const getCalendar = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;

    const [trip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
      .limit(1);

    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    // Fetch stops
    const stopsList = await db
      .select({
        id: tripStops.id,
        title: tripStops.title,
        startDate: tripStops.startDate,
        endDate: tripStops.endDate,
        cityName: cities.name,
      })
      .from(tripStops)
      .leftJoin(cities, eq(tripStops.cityId, cities.id))
      .where(eq(tripStops.tripId, tripId))
      .orderBy(asc(tripStops.sortOrder));

    // Fetch activities
    const allActivities = await db
      .select({
        id: tripStopActivities.id,
        tripStopId: tripStopActivities.tripStopId,
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

    // Build day-wise structure
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const dayCount = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    const days = [];
    for (let i = 0; i < dayCount; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];

      const activeStop = stopsList.find(s => {
        const sStart = new Date(s.startDate);
        const sEnd = new Date(s.endDate);
        return current >= sStart && current <= sEnd;
      }) || stopsList[0] || null;

      const items = allActivities
        .filter(a => (a.scheduledDate ? a.scheduledDate === dateStr : a.tripStopId === activeStop?.id))
        .map(a => ({
          type: 'activity',
          id: a.id,
          title: a.name,
          time: a.scheduledTime ? a.scheduledTime.slice(0, 5) : '09:00',
          category: a.category,
          cost: parseFloat(a.costOverride !== null ? a.costOverride : a.estimatedCost) || 0,
        }));

      days.push({
        dayNumber: i + 1,
        date: dateStr,
        stopTitle: activeStop?.title || activeStop?.cityName || `Day ${i + 1}`,
        items,
      });
    }

    return res.status(200).json({
      data: {
        tripId: trip.id,
        tripName: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        days,
      }
    });
  } catch (err) {
    console.error('Error fetching calendar:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch calendar.' }
    });
  }
};

module.exports = {
  getCalendar,
};
