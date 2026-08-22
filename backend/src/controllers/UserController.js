const { db } = require('../config/db');
const { users, savedDestinations, cities, trips } = require('../db/schema');
const { eq, sql, and } = require('drizzle-orm');
const imagekit = require('../services/imagekit');

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

// PUT /api/v1/users/me
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, username, phoneNumber, city, country } = req.body;

    let updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (username !== undefined) updateData.username = username;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;

    // Handle Image upload if provided
    if (req.file) {
      const uploadRes = await imagekit.upload({
        file: req.file.buffer, // required
        fileName: `user_profile_${userId}_${Date.now()}`, // required
        folder: '/globetrotter/users'
      });
      updateData.photoUrl = uploadRes.url;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile.'
      }
    });
  }
};

module.exports = {
  getMe,
  getSavedDestinations,
  updateProfile
};
