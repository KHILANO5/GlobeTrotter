const { db } = require('../config/db');
const { trips, tripStops, users, tripShares, tripStopActivities, tripCopies } = require('../db/schema');
const { eq, desc, asc, and, ilike, sql, or, isNull } = require('drizzle-orm');
const imagekit = require('../services/imagekit');

// GET /api/v1/trips & /api/trips
const getTrips = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, search, sort = 'startDate:asc', page = 1, pageSize = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const offsetNum = (pageNum - 1) * limitNum;

    const conditions = [eq(trips.userId, userId)];

    if (status && ['upcoming', 'ongoing', 'completed'].includes(status.toLowerCase())) {
      conditions.push(eq(trips.status, status.toLowerCase()));
    }

    if (search && search.trim()) {
      conditions.push(ilike(trips.name, `%${search.trim()}%`));
    }

    const whereClause = and(...conditions);

    // Sorting
    let orderByClause = asc(trips.startDate);
    if (sort) {
      const [field, direction] = sort.split(':');
      const isAsc = direction === 'asc';
      if (field === 'startDate') orderByClause = isAsc ? asc(trips.startDate) : desc(trips.startDate);
      else if (field === 'createdAt') orderByClause = isAsc ? asc(trips.createdAt) : desc(trips.createdAt);
      else if (field === 'name') orderByClause = isAsc ? asc(trips.name) : desc(trips.name);
    }

    const tripList = await db
      .select({
        id: trips.id,
        name: trips.name,
        description: trips.description,
        startDate: trips.startDate,
        endDate: trips.endDate,
        status: trips.status,
        totalBudget: trips.totalBudget,
        coverPhotoUrl: trips.coverPhotoUrl,
        isPublic: trips.isPublic,
        createdAt: trips.createdAt,
        updatedAt: trips.updatedAt
      })
      .from(trips)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offsetNum);

    const [countResult] = await db
      .select({ total: sql`count(*)` })
      .from(trips)
      .where(whereClause);

    const total = parseInt(countResult?.total || 0, 10);
    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      data: tripList,
      meta: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching trips:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch trips.'
      }
    });
  }
};

// POST /api/v1/trips & /api/trips
const createTrip = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, startDate, endDate, totalBudget, coverPhotoUrl } = req.body;

    // 1. Name Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Trip name is required and cannot be empty.'
        }
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Trip name must be between 2 and 120 characters.'
        }
      });
    }

    // 2. Date Validation
    if (!startDate || !endDate) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both start date and end date are required.'
        }
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid start or end date format.'
        }
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (startDate < todayStr) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start date cannot be in the past. Please select today or a future date.'
        }
      });
    }

    if (end < start) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'End date cannot be earlier than start date.'
        }
      });
    }

    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 365) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Maximum trip duration cannot exceed 365 days (1 year).'
        }
      });
    }

    // 3. Budget Validation
    let sanitizedBudget = null;
    if (totalBudget !== undefined && totalBudget !== null && totalBudget !== '') {
      const parsedBudget = parseFloat(totalBudget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Target budget must be a positive number or zero.'
          }
        });
      }
      if (parsedBudget > 10000000) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Target budget cannot exceed $10,000,000.'
          }
        });
      }
      sanitizedBudget = parsedBudget.toFixed(2);
    }

    // 4. Cover Photo URL Validation
    let sanitizedPhotoUrl = null;
    
    if (req.file) {
      const uploadRes = await imagekit.upload({
        file: req.file.buffer,
        fileName: `trip_cover_${userId}_${Date.now()}`,
        folder: '/globetrotter/trips'
      });
      sanitizedPhotoUrl = uploadRes.url;
    } else if (coverPhotoUrl && typeof coverPhotoUrl === 'string' && coverPhotoUrl.trim()) {
      const trimmedUrl = coverPhotoUrl.trim();
      if (!/^https?:\/\//i.test(trimmedUrl) && !trimmedUrl.startsWith('data:image/')) {
        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cover photo URL must start with http:// or https://'
          }
        });
      }
      sanitizedPhotoUrl = trimmedUrl.slice(0, 1000);
    }

    // 5. Description Sanitization
    const sanitizedDesc = description && typeof description === 'string' 
      ? description.trim().slice(0, 2000) 
      : null;

    const now = new Date();
    let status = 'upcoming';
    if (now >= start && now <= end) {
      status = 'ongoing';
    } else if (now > end) {
      status = 'completed';
    }

    const [newTrip] = await db
      .insert(trips)
      .values({
        userId,
        name: trimmedName,
        description: sanitizedDesc,
        startDate: startDate,
        endDate: endDate,
        status,
        totalBudget: sanitizedBudget,
        coverPhotoUrl: sanitizedPhotoUrl
      })
      .returning();

    return res.status(201).json({ data: newTrip });
  } catch (err) {
    console.error('Error creating trip:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create trip.'
      }
    });
  }
};

// GET /api/v1/trips/:tripId & /api/trips/:tripId
const getTripById = async (req, res) => {
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
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found or you do not have permission to view it.'
        }
      });
    }

    // Also fetch stops
    const stops = await db
      .select()
      .from(tripStops)
      .where(eq(tripStops.tripId, tripId))
      .orderBy(asc(tripStops.sortOrder));

    return res.status(200).json({
      data: {
        ...trip,
        stops
      }
    });
  } catch (err) {
    console.error('Error fetching trip by ID:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch trip details.'
      }
    });
  }
};

// GET /api/v1/community/trips & /api/community/trips
const getCommunityTrips = async (req, res) => {
  try {
    const { search, sort = 'createdAt:desc', page = 1, pageSize = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const offsetNum = (pageNum - 1) * limitNum;

    const conditions = [eq(trips.isPublic, true)];
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(or(ilike(trips.name, s), ilike(trips.description, s)));
    }

    const whereClause = and(...conditions);

    // Sorting
    let orderByClause = desc(trips.createdAt);
    if (sort) {
      const [field, direction] = sort.split(':');
      const isAsc = direction === 'asc';
      if (field === 'startDate') orderByClause = isAsc ? asc(trips.startDate) : desc(trips.startDate);
      else if (field === 'totalBudget') orderByClause = isAsc ? asc(trips.totalBudget) : desc(trips.totalBudget);
      else if (field === 'name') orderByClause = isAsc ? asc(trips.name) : desc(trips.name);
      else if (field === 'createdAt') orderByClause = isAsc ? asc(trips.createdAt) : desc(trips.createdAt);
    }

    const communityList = await db
      .select({
        id: trips.id,
        name: trips.name,
        description: trips.description,
        startDate: trips.startDate,
        endDate: trips.endDate,
        status: trips.status,
        totalBudget: trips.totalBudget,
        coverPhotoUrl: trips.coverPhotoUrl,
        createdAt: trips.createdAt,
        ownerId: users.id,
        ownerFirstName: users.firstName,
        ownerLastName: users.lastName,
        ownerUsername: users.username,
        ownerPhotoUrl: users.photoUrl,
        ownerCity: users.city,
        ownerCountry: users.country,
        shareToken: tripShares.shareToken
      })
      .from(trips)
      .leftJoin(users, eq(trips.userId, users.id))
      .leftJoin(tripShares, and(eq(trips.id, tripShares.tripId), isNull(tripShares.revokedAt)))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offsetNum);

    const [countResult] = await db
      .select({ total: sql`count(*)` })
      .from(trips)
      .where(whereClause);

    const total = parseInt(countResult?.total || 0, 10);
    const totalPages = Math.ceil(total / limitNum);

    const formatted = communityList.map(t => {
      const displayName = `${t.ownerFirstName || ''} ${t.ownerLastName ? t.ownerLastName[0] + '.' : ''}`.trim() || t.ownerUsername || 'GlobeTrotter Traveler';
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        totalBudget: t.totalBudget,
        coverPhotoUrl: t.coverPhotoUrl,
        createdAt: t.createdAt,
        shareToken: t.shareToken,
        owner: {
          id: t.ownerId,
          firstName: t.ownerFirstName,
          lastName: t.ownerLastName,
          username: t.ownerUsername,
          photoUrl: t.ownerPhotoUrl,
          city: t.ownerCity,
          country: t.ownerCountry,
          displayName
        },
        ownerDisplayName: displayName
      };
    });

    return res.status(200).json({
      data: formatted,
      meta: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching community trips:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch community trips.'
      }
    });
  }
};

// PUT /api/v1/trips/:tripId
const updateTrip = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;
    const { name, description, startDate, endDate, totalBudget, coverPhotoUrl, isPublic } = req.body;

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

    const updates = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (totalBudget !== undefined) updates.totalBudget = totalBudget ? String(totalBudget) : null;
    if (coverPhotoUrl !== undefined) updates.coverPhotoUrl = coverPhotoUrl;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    // Recalculate status if dates changed
    const sDate = updates.startDate ? new Date(updates.startDate) : new Date(trip.startDate);
    const eDate = updates.endDate ? new Date(updates.endDate) : new Date(trip.endDate);
    const now = new Date();
    if (now >= sDate && now <= eDate) {
      updates.status = 'ongoing';
    } else if (now > eDate) {
      updates.status = 'completed';
    } else {
      updates.status = 'upcoming';
    }

    const [updated] = await db
      .update(trips)
      .set(updates)
      .where(eq(trips.id, tripId))
      .returning();

    return res.status(200).json({ data: updated });
  } catch (err) {
    console.error('Error updating trip:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update trip.' }
    });
  }
};

// DELETE /api/v1/trips/:tripId
const deleteTrip = async (req, res) => {
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

    await db.delete(trips).where(eq(trips.id, tripId));
    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting trip:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete trip.' }
    });
  }
};

// POST /api/v1/trips/:tripId/copy
const copyPublicTrip = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;

    const [originalTrip] = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, tripId), eq(trips.isPublic, true)))
      .limit(1);

    if (!originalTrip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Public trip not found.' }
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
    console.error('Error copying public trip:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to copy trip.' }
    });
  }
};

module.exports = {
  getTrips,
  createTrip,
  getTripById,
  updateTrip,
  deleteTrip,
  getCommunityTrips,
  copyPublicTrip
};

