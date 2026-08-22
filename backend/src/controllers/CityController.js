const { db } = require('../config/db');
const { cities } = require('../db/schema');
const { eq, ilike, desc, asc, and, or, sql } = require('drizzle-orm');

// GET /api/v1/cities & /api/cities
const getCities = async (req, res) => {
  try {
    const { search, country, region, sort = 'popularityScore:desc', page = 1, pageSize = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const offsetNum = (pageNum - 1) * limitNum;

    // Conditions
    const conditions = [];
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(or(ilike(cities.name, s), ilike(cities.country, s)));
    }
    if (country && country.trim()) {
      conditions.push(ilike(cities.country, `%${country.trim()}%`));
    }
    if (region && region.trim()) {
      conditions.push(ilike(cities.region, `%${region.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    let orderByClause = desc(cities.popularityScore);
    if (sort) {
      const [field, direction] = sort.split(':');
      const isAsc = direction === 'asc';
      if (field === 'name') orderByClause = isAsc ? asc(cities.name) : desc(cities.name);
      else if (field === 'costIndex') orderByClause = isAsc ? asc(cities.costIndex) : desc(cities.costIndex);
      else if (field === 'popularityScore') orderByClause = isAsc ? asc(cities.popularityScore) : desc(cities.popularityScore);
    }

    // Query DB
    const cityList = await db
      .select()
      .from(cities)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offsetNum);

    const [countResult] = await db
      .select({ total: sql`count(*)` })
      .from(cities)
      .where(whereClause);

    const total = parseInt(countResult?.total || 0, 10);
    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      data: cityList,
      meta: {
        page: pageNum,
        pageSize: limitNum,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching cities:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch cities from database.'
      }
    });
  }
};

// GET /api/v1/cities/:cityId & /api/cities/:cityId
const getCityById = async (req, res) => {
  try {
    const { cityId } = req.params;

    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

    if (!city) {
      return res.status(404).json({
        error: {
          code: 'CITY_NOT_FOUND',
          message: 'City not found'
        }
      });
    }

    return res.status(200).json({ data: city });
  } catch (err) {
    console.error('Error fetching city details:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch city details.'
      }
    });
  }
};

module.exports = {
  getCities,
  getCityById
};
