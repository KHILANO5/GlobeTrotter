const crypto = require('crypto');
const { db } = require('../config/db');
const { trips, tripStops, tripStopActivities, tripShares, tripCopies, activities, cities, users } = require('../db/schema');
const { eq, and, isNull, asc } = require('drizzle-orm');

// Helper to generate a clean token
const generateShareToken = () => {
  return 'shr_' + crypto.randomBytes(8).toString('hex');
};

// POST /api/v1/trips/:tripId/share (Owner only)
const createShare = async (req, res) => {
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

    // Check if active share already exists
    const [existingShare] = await db
      .select()
      .from(tripShares)
      .where(and(eq(tripShares.tripId, tripId), isNull(tripShares.revokedAt)))
      .limit(1);

    let token = existingShare?.shareToken;

    if (!existingShare) {
      token = generateShareToken();
      await db.insert(tripShares).values({
        tripId,
        shareToken: token,
        createdBy: userId,
      });
    }

    // Mark trip as public
    await db.update(trips).set({ isPublic: true }).where(eq(trips.id, tripId));

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const shareUrl = `${baseUrl}/shared/${token}`;

    return res.status(201).json({
      data: {
        shareToken: token,
        shareUrl,
        createdAt: existingShare?.createdAt || new Date(),
      }
    });
  } catch (err) {
    console.error('Error sharing trip:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate share link.' }
    });
  }
};

// GET /api/v1/shared/:shareToken (Public, no auth)
const getSharedTrip = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const [share] = await db
      .select()
      .from(tripShares)
      .where(and(eq(tripShares.shareToken, shareToken), isNull(tripShares.revokedAt)))
      .limit(1);

    if (!share) {
      return res.status(404).json({
        error: { code: 'SHARE_TOKEN_INVALID', message: 'Share link not found or has been revoked.' }
      });
    }

    // Increment view count
    await db
      .update(tripShares)
      .set({ viewCount: (share.viewCount || 0) + 1 })
      .where(eq(tripShares.id, share.id));

    // Fetch trip details & owner info
    const [trip] = await db
      .select({
        id: trips.id,
        name: trips.name,
        description: trips.description,
        startDate: trips.startDate,
        endDate: trips.endDate,
        totalBudget: trips.totalBudget,
        coverPhotoUrl: trips.coverPhotoUrl,
        createdAt: trips.createdAt,
        ownerFirstName: users.firstName,
        ownerLastName: users.lastName,
        ownerUsername: users.username,
      })
      .from(trips)
      .leftJoin(users, eq(trips.userId, users.id))
      .where(eq(trips.id, share.tripId))
      .limit(1);

    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Shared trip not found.' }
      });
    }

    // Fetch stops
    const stopsList = await db
      .select({
        id: tripStops.id,
        title: tripStops.title,
        startDate: tripStops.startDate,
        endDate: tripStops.endDate,
        type: tripStops.type,
        cityName: cities.name,
        cityCountry: cities.country,
        cityImageUrl: cities.imageUrl,
      })
      .from(tripStops)
      .leftJoin(cities, eq(tripStops.cityId, cities.id))
      .where(eq(tripStops.tripId, trip.id))
      .orderBy(asc(tripStops.sortOrder));

    // Fetch activities
    const allActivities = await db
      .select({
        id: tripStopActivities.id,
        tripStopId: tripStopActivities.tripStopId,
        name: activities.name,
        category: activities.category,
        scheduledDate: tripStopActivities.scheduledDate,
        scheduledTime: tripStopActivities.scheduledTime,
        costOverride: tripStopActivities.costOverride,
        estimatedCost: activities.estimatedCost,
      })
      .from(tripStopActivities)
      .innerJoin(tripStops, eq(tripStopActivities.tripStopId, tripStops.id))
      .leftJoin(activities, eq(tripStopActivities.activityId, activities.id))
      .where(eq(tripStops.tripId, trip.id))
      .orderBy(asc(tripStopActivities.sortOrder));

    // Day-by-day mapping
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

      const dayActs = allActivities
        .filter(a => {
          if (a.scheduledDate) return a.scheduledDate === dateStr;
          const stopStartStr = activeStop?.startDate ? new Date(activeStop.startDate).toISOString().split('T')[0] : null;
          if (stopStartStr) {
            return a.tripStopId === activeStop?.id && dateStr === stopStartStr;
          }
          return a.tripStopId === activeStop?.id && i === 0;
        })
        .map(a => ({
          name: a.name,
          category: a.category,
          scheduledTime: a.scheduledTime ? a.scheduledTime.slice(0, 5) : '09:00',
        }));

      days.push({
        dayNumber: i + 1,
        date: dateStr,
        stopTitle: activeStop?.title || activeStop?.cityName || `Day ${i + 1}`,
        cityName: activeStop?.cityName || null,
        cityCountry: activeStop?.cityCountry || null,
        activities: dayActs,
      });
    }

    const ownerDisplayName = `${trip.ownerFirstName || ''} ${trip.ownerLastName ? trip.ownerLastName[0] + '.' : ''}`.trim() || trip.ownerUsername || 'GlobeTrotter Traveler';

    return res.status(200).json({
      data: {
        shareToken,
        tripId: trip.id,
        tripName: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalBudget: trip.totalBudget,
        coverPhotoUrl: trip.coverPhotoUrl,
        ownerDisplayName,
        days,
        stops: stopsList,
      }
    });
  } catch (err) {
    console.error('Error fetching shared trip:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to load shared trip.' }
    });
  }
};

// POST /api/v1/shared/:shareToken/copy (Auth required)
const copySharedTrip = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shareToken } = req.params;

    const [share] = await db
      .select()
      .from(tripShares)
      .where(and(eq(tripShares.shareToken, shareToken), isNull(tripShares.revokedAt)))
      .limit(1);

    if (!share) {
      return res.status(404).json({
        error: { code: 'SHARE_TOKEN_INVALID', message: 'Share link not found or invalid.' }
      });
    }

    const [originalTrip] = await db
      .select()
      .from(trips)
      .where(eq(trips.id, share.tripId))
      .limit(1);

    if (!originalTrip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Source trip not found.' }
      });
    }

    // 1. Clone trip
    const [newTrip] = await db
      .insert(trips)
      .values({
        userId,
        name: `Copy of ${originalTrip.name}`,
        description: originalTrip.description,
        startDate: originalTrip.startDate,
        endDate: originalTrip.endDate,
        status: 'upcoming',
        totalBudget: originalTrip.totalBudget,
        coverPhotoUrl: originalTrip.coverPhotoUrl,
        isPublic: false,
      })
      .returning();

    // 2. Clone stops & their activities
    const originalStops = await db
      .select()
      .from(tripStops)
      .where(eq(tripStops.tripId, originalTrip.id))
      .orderBy(asc(tripStops.sortOrder));

    for (const stop of originalStops) {
      const [newStop] = await db
        .insert(tripStops)
        .values({
          tripId: newTrip.id,
          cityId: stop.cityId,
          type: stop.type,
          title: stop.title,
          description: stop.description,
          startDate: stop.startDate,
          endDate: stop.endDate,
          budget: stop.budget,
          sortOrder: stop.sortOrder,
        })
        .returning();

      const originalStopActs = await db
        .select()
        .from(tripStopActivities)
        .where(eq(tripStopActivities.tripStopId, stop.id));

      for (const act of originalStopActs) {
        await db.insert(tripStopActivities).values({
          tripStopId: newStop.id,
          activityId: act.activityId,
          scheduledDate: act.scheduledDate,
          scheduledTime: act.scheduledTime,
          costOverride: act.costOverride,
          sortOrder: act.sortOrder,
        });
      }
    }

    // 3. Record provenance
    await db.insert(tripCopies).values({
      sourceTripId: originalTrip.id,
      copiedTripId: newTrip.id,
      copiedBy: userId,
    });

    return res.status(201).json({
      data: newTrip
    });
  } catch (err) {
    console.error('Error copying shared trip:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to copy trip.' }
    });
  }
};

module.exports = {
  createShare,
  getSharedTrip,
  copySharedTrip,
};
