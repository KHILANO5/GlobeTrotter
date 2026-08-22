const { db } = require('../config/db');
const { users, savedDestinations, cities, trips } = require('../db/schema');
const { eq, sql, and } = require('drizzle-orm');

// GET /api/v1/users/me & /api/users/me
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        email: users.email,
        phoneNumber: users.phoneNumber,
        city: users.city,
        country: users.country,
        photoUrl: users.photoUrl,
        languagePreference: users.languagePreference,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.'
        }
      });
    }

    // Also get counts
    const [tripsCount] = await db
      .select({ count: sql`count(*)` })
      .from(trips)
      .where(eq(trips.userId, userId));

    const [savedCount] = await db
      .select({ count: sql`count(*)` })
      .from(savedDestinations)
      .where(eq(savedDestinations.userId, userId));

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;

    return res.status(200).json({
      data: {
        ...user,
        fullName,
        stats: {
          totalTrips: parseInt(tripsCount?.count || 0, 10),
          savedDestinationsCount: parseInt(savedCount?.count || 0, 10)
        }
      },
      user: {
        ...user,
        fullName,
        stats: {
          totalTrips: parseInt(tripsCount?.count || 0, 10),
          savedDestinationsCount: parseInt(savedCount?.count || 0, 10)
        }
      }
    });
  } catch (err) {
    console.error('Error in getMe:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user profile.'
      }
    });
  }
};

// GET /api/v1/users/me/saved-destinations
const getSavedDestinations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const saved = await db
      .select({
        id: savedDestinations.id,
        createdAt: savedDestinations.createdAt,
        city: {
          id: cities.id,
          name: cities.name,
          country: cities.country,
          region: cities.region,
          costIndex: cities.costIndex,
          popularityScore: cities.popularityScore,
          imageUrl: cities.imageUrl
        }
      })
      .from(savedDestinations)
      .innerJoin(cities, eq(savedDestinations.cityId, cities.id))
      .where(eq(savedDestinations.userId, userId));

    return res.status(200).json({ data: saved });
  } catch (err) {
    console.error('Error fetching saved destinations:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch saved destinations.'
      }
    });
  }
};

module.exports = {
  getMe,
  getSavedDestinations
};
