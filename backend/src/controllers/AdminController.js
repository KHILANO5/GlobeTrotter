const { db, pool } = require('../config/db');
const { users, trips, tripStops, tripStopActivities, cities, activities } = require('../db/schema');
const { eq, ilike, desc, asc, and, or, sql, isNull, isNotNull } = require('drizzle-orm');

// ─── 1. User Management Endpoints ──────────────────────────────────────────

// GET /api/v1/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, role, sort = 'createdAt:desc', page = 1, pageSize = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const offsetNum = (pageNum - 1) * limitNum;

    // Conditions
    const conditions = [isNull(users.deletedAt)];
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(users.username, s),
          ilike(users.email, s),
          ilike(users.firstName, s),
          ilike(users.lastName, s)
        )
      );
    }
    if (role && role.trim() && (role.toLowerCase() === 'user' || role.toLowerCase() === 'admin')) {
      conditions.push(eq(users.role, role.toLowerCase()));
    }

    const whereClause = and(...conditions);

    // Sorting
    let orderByClause = desc(users.createdAt);
    if (sort) {
      const [field, direction] = sort.split(':');
      const isAsc = direction === 'asc';
      if (field === 'createdAt') orderByClause = isAsc ? asc(users.createdAt) : desc(users.createdAt);
      else if (field === 'username') orderByClause = isAsc ? asc(users.username) : desc(users.username);
      else if (field === 'email') orderByClause = isAsc ? asc(users.email) : desc(users.email);
      else if (field === 'role') orderByClause = isAsc ? asc(users.role) : desc(users.role);
    }

    // Query Users with aggregated trip count
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        photoUrl: users.photoUrl,
        phoneNumber: users.phoneNumber,
        city: users.city,
        country: users.country,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        tripCount: sql`COALESCE((SELECT count(*)::int FROM trips WHERE trips.user_id = "users"."id" AND trips.deleted_at IS NULL), 0)`
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offsetNum);

    const [countResult] = await db
      .select({ total: sql`count(*)` })
      .from(users)
      .where(whereClause);

    const total = parseInt(countResult?.total || 0, 10);
    const totalPages = Math.ceil(total / limitNum);

    const formattedUsers = usersList.map(u => ({
      ...u,
      fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
      tripCount: u.tripCount || 0
    }));

    // If client requested sort by tripCount
    if (sort && sort.startsWith('tripCount')) {
      const isAsc = sort.endsWith(':asc');
      formattedUsers.sort((a, b) => isAsc ? a.tripCount - b.tripCount : b.tripCount - a.tripCount);
    }

    return res.status(200).json({
      data: formattedUsers,
      meta: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users list.' }
    });
  }
};

// GET /api/v1/admin/users/:userId/trips
const getUserTrips = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check user
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    // Get user's trips
    const userTrips = await db
      .select({
        id: trips.id,
        name: trips.name,
        description: trips.description,
        coverPhotoUrl: trips.coverPhotoUrl,
        startDate: trips.startDate,
        endDate: trips.endDate,
        status: trips.status,
        totalBudget: trips.totalBudget,
        isPublic: trips.isPublic,
        createdAt: trips.createdAt,
        destinationCount: sql`COALESCE((SELECT count(*)::int FROM trip_stops WHERE trip_stops.trip_id = "trips"."id"), 0)`
      })
      .from(trips)
      .where(and(eq(trips.userId, userId), isNull(trips.deletedAt)))
      .orderBy(desc(trips.createdAt));

    return res.status(200).json({
      data: userTrips,
      user: {
        ...user,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
      }
    });
  } catch (err) {
    console.error('Error fetching user trips for admin:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user trips.' }
    });
  }
};

// PATCH /api/v1/admin/users/:userId/role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'user' && role !== 'admin')) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Role must be either "user" or "admin".' }
      });
    }

    // Check if trying to edit own role
    if (req.user.userId === userId && role !== 'admin') {
      return res.status(400).json({
        error: { code: 'SELF_DEMOTION_FORBIDDEN', message: 'You cannot remove your own admin status.' }
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    return res.status(200).json({
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        message: `User role successfully updated to ${role}.`
      }
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update user role.' }
    });
  }
};

// DELETE /api/v1/admin/users/:userId
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId === userId) {
      return res.status(400).json({
        error: { code: 'SELF_DELETION_FORBIDDEN', message: 'You cannot delete your own admin account.' }
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' }
      });
    }

    // Soft delete
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));

    return res.status(200).json({
      data: { message: `User ${user.email} has been deactivated.` }
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user.' }
    });
  }
};

// ─── 2. Analytics Endpoints ────────────────────────────────────────────────

// GET /api/v1/admin/analytics/popular-cities
const getPopularCities = async (req, res) => {
  try {
    const { search, region, sort = 'tripCount:desc', limit = 20 } = req.query;

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // Conditions
    const conditions = [];
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(or(ilike(cities.name, s), ilike(cities.country, s)));
    }
    if (region && region.trim()) {
      conditions.push(ilike(cities.region, `%${region.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query cities joined with real trip stop count + base popularity score
    const cityAnalytics = await db
      .select({
        cityId: cities.id,
        name: cities.name,
        country: cities.country,
        region: cities.region,
        costIndex: cities.costIndex,
        popularityScore: cities.popularityScore,
        imageUrl: cities.imageUrl,
        tripCount: sql`COALESCE((SELECT count(*)::int FROM trip_stops WHERE trip_stops.city_id = "cities"."id"), 0)`
      })
      .from(cities)
      .where(whereClause)
      .limit(limitNum);

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(':');
      const isAsc = direction === 'asc';
      if (field === 'tripCount') {
        cityAnalytics.sort((a, b) => isAsc ? (a.tripCount - b.tripCount) : (b.tripCount - a.tripCount));
      } else if (field === 'popularityScore') {
        cityAnalytics.sort((a, b) => isAsc ? (a.popularityScore - b.popularityScore) : (b.popularityScore - a.popularityScore));
      } else if (field === 'costIndex') {
        cityAnalytics.sort((a, b) => isAsc ? (parseFloat(a.costIndex || 0) - parseFloat(b.costIndex || 0)) : (parseFloat(b.costIndex || 0) - parseFloat(a.costIndex || 0)));
      } else if (field === 'name') {
        cityAnalytics.sort((a, b) => isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      }
    } else {
      cityAnalytics.sort((a, b) => (b.tripCount - a.tripCount) || (b.popularityScore - a.popularityScore));
    }

    return res.status(200).json({
      data: cityAnalytics
    });
  } catch (err) {
    console.error('Error fetching popular cities analytics:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch popular cities analytics.' }
    });
  }
};

// GET /api/v1/admin/analytics/popular-activities
const getPopularActivities = async (req, res) => {
  try {
    const { search, category, sort = 'addCount:desc', limit = 20 } = req.query;

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const conditions = [];
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(or(ilike(activities.name, s), ilike(cities.name, s)));
    }
    if (category && category.trim()) {
      conditions.push(eq(activities.category, category.toLowerCase().trim()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const activityAnalytics = await db
      .select({
        activityId: activities.id,
        name: activities.name,
        category: activities.category,
        description: activities.description,
        estimatedCost: activities.estimatedCost,
        estimatedDurationMinutes: activities.estimatedDurationMinutes,
        imageUrl: activities.imageUrl,
        cityName: cities.name,
        countryName: cities.country,
        addCount: sql`COALESCE((SELECT count(*)::int FROM trip_stop_activities WHERE trip_stop_activities.activity_id = "activities"."id"), 0)`
      })
      .from(activities)
      .leftJoin(cities, eq(activities.cityId, cities.id))
      .where(whereClause)
      .limit(limitNum);

    // Apply sorting
    if (sort) {
      const [field, direction] = sort.split(':');
      const isAsc = direction === 'asc';
      if (field === 'addCount') {
        activityAnalytics.sort((a, b) => isAsc ? (a.addCount - b.addCount) : (b.addCount - a.addCount));
      } else if (field === 'cost' || field === 'estimatedCost') {
        activityAnalytics.sort((a, b) => isAsc ? (parseFloat(a.estimatedCost || 0) - parseFloat(b.estimatedCost || 0)) : (parseFloat(b.estimatedCost || 0) - parseFloat(a.estimatedCost || 0)));
      } else if (field === 'name') {
        activityAnalytics.sort((a, b) => isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      }
    } else {
      activityAnalytics.sort((a, b) => (b.addCount - a.addCount) || a.name.localeCompare(b.name));
    }

    return res.status(200).json({
      data: activityAnalytics
    });
  } catch (err) {
    console.error('Error fetching popular activities analytics:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch popular activities analytics.' }
    });
  }
};

// GET /api/v1/admin/analytics/engagement
const getEngagementAnalytics = async (req, res) => {
  try {
    // 1. Total counts from DB
    const [totalUsersRes] = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(isNull(users.deletedAt));

    const [totalTripsRes] = await db
      .select({
        total: sql`count(*)`,
        publicTrips: sql`count(*) filter (where is_public = true)`,
        avgBudget: sql`coalesce(avg(total_budget), 0)`
      })
      .from(trips)
      .where(isNull(trips.deletedAt));

    const [activeUsersRes] = await db
      .select({
        count: sql`count(distinct user_id)`
      })
      .from(trips)
      .where(and(isNull(trips.deletedAt), sql`created_at >= NOW() - INTERVAL '30 days'`));

    const [totalCitiesRes] = await db.select({ count: sql`count(*)` }).from(cities);
    const [totalActivitiesRes] = await db.select({ count: sql`count(*)` }).from(activities);
    const [totalStopsRes] = await db.select({ count: sql`count(*)` }).from(tripStops);

    // 2. Trip Status Distribution (for Pie Chart)
    const tripStatusRes = await db
      .select({
        status: trips.status,
        count: sql`count(*)::int`
      })
      .from(trips)
      .where(isNull(trips.deletedAt))
      .groupBy(trips.status);

    const tripStatusMap = { upcoming: 0, ongoing: 0, completed: 0 };
    tripStatusRes.forEach(r => {
      if (r.status) tripStatusMap[r.status] = r.count;
    });

    const statusBreakdown = [
      { name: 'Upcoming', value: tripStatusMap.upcoming || 0, color: '#3b82f6' },
      { name: 'Ongoing', value: tripStatusMap.ongoing || 0, color: '#10b981' },
      { name: 'Completed', value: tripStatusMap.completed || 0, color: '#8b5cf6' },
    ];

    // 3. Activity Category Breakdown (for Distribution / Bar Chart)
    const categoryRes = await db
      .select({
        category: activities.category,
        count: sql`count(*)::int`
      })
      .from(activities)
      .groupBy(activities.category);

    const categoryBreakdown = categoryRes.map(c => ({
      name: c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : 'Other',
      count: c.count
    }));

    // 4. Monthly Trend Data (for Line Chart & Timeline)
    const monthlyTripsRes = await db
      .select({
        month: sql`to_char(created_at, 'Mon YY')`,
        count: sql`count(*)::int`,
        dateSort: sql`date_trunc('month', created_at)`
      })
      .from(trips)
      .where(isNull(trips.deletedAt))
      .groupBy(sql`to_char(created_at, 'Mon YY')`, sql`date_trunc('month', created_at)`)
      .orderBy(sql`date_trunc('month', created_at)`);

    const monthlyUsersRes = await db
      .select({
        month: sql`to_char(created_at, 'Mon YY')`,
        count: sql`count(*)::int`,
        dateSort: sql`date_trunc('month', created_at)`
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .groupBy(sql`to_char(created_at, 'Mon YY')`, sql`date_trunc('month', created_at)`)
      .orderBy(sql`date_trunc('month', created_at)`);

    // Merge trend data
    const trendMap = {};
    monthlyTripsRes.forEach(t => {
      trendMap[t.month] = { month: t.month, trips: t.count, users: 0 };
    });
    monthlyUsersRes.forEach(u => {
      if (!trendMap[u.month]) {
        trendMap[u.month] = { month: u.month, trips: 0, users: u.count };
      } else {
        trendMap[u.month].users = u.count;
      }
    });

    const trends = Object.values(trendMap);
    if (trends.length === 0) {
      trends.push({ month: 'Current', trips: parseInt(totalTripsRes?.total || 0, 10), users: parseInt(totalUsersRes?.count || 0, 10) });
    }

    return res.status(200).json({
      data: {
        totalUsers: parseInt(totalUsersRes?.count || 0, 10),
        totalTrips: parseInt(totalTripsRes?.total || 0, 10),
        activeUsersLast30Days: parseInt(activeUsersRes?.count || 0, 10) || parseInt(totalUsersRes?.count || 0, 10),
        totalPublicTrips: parseInt(totalTripsRes?.publicTrips || 0, 10),
        totalCities: parseInt(totalCitiesRes?.count || 0, 10),
        totalActivities: parseInt(totalActivitiesRes?.count || 0, 10),
        totalStops: parseInt(totalStopsRes?.count || 0, 10),
        averageBudget: parseFloat(totalTripsRes?.avgBudget || 0).toFixed(2),
        statusBreakdown,
        categoryBreakdown,
        trends
      }
    });
  } catch (err) {
    console.error('Error fetching engagement analytics:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch engagement analytics.' }
    });
  }
};

module.exports = {
  getUsers,
  getUserTrips,
  updateUserRole,
  deleteUser,
  getPopularCities,
  getPopularActivities,
  getEngagementAnalytics
};
