const { db } = require('../config/db');
const { trips, tripStops, tripStopActivities, activities, expenses } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');

// Helper to verify trip ownership
const verifyTripOwnership = async (tripId, userId) => {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);
  return trip;
};

// GET /api/v1/trips/:tripId/budget
const getBudget = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    // 1. Fetch all assigned activities in this trip
    const assignedActs = await db
      .select({
        id: tripStopActivities.id,
        scheduledDate: tripStopActivities.scheduledDate,
        costOverride: tripStopActivities.costOverride,
        estimatedCost: activities.estimatedCost,
      })
      .from(tripStopActivities)
      .innerJoin(tripStops, eq(tripStopActivities.tripStopId, tripStops.id))
      .leftJoin(activities, eq(tripStopActivities.activityId, activities.id))
      .where(eq(tripStops.tripId, tripId));

    let activitiesTotal = 0;
    const dailyCosts = {};

    for (const act of assignedActs) {
      const cost = parseFloat(act.costOverride !== null ? act.costOverride : act.estimatedCost) || 0;
      activitiesTotal += cost;
      if (act.scheduledDate) {
        dailyCosts[act.scheduledDate] = (dailyCosts[act.scheduledDate] || 0) + cost;
      }
    }

    // 2. Fetch all expenses for this trip
    const tripExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.tripId, tripId))
      .orderBy(desc(expenses.createdAt));

    const breakdown = {
      transport: 0,
      stay: 0,
      activities: activitiesTotal,
      meals: 0,
      other: 0,
    };

    for (const exp of tripExpenses) {
      const amount = parseFloat(exp.amount) || 0;
      const cat = exp.category?.toLowerCase() || 'other';
      if (breakdown[cat] !== undefined) {
        breakdown[cat] += amount;
      } else {
        breakdown.other += amount;
      }
    }

    const totalEstimatedCost = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    // Calculate days count and average cost per day
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    const averageCostPerDay = parseFloat((totalEstimatedCost / totalDays).toFixed(2));

    // Determine over-budget days
    const totalBudgetNum = parseFloat(trip.totalBudget) || 0;
    const dailyBudgetCap = totalBudgetNum > 0 ? (totalBudgetNum / totalDays) : Infinity;
    const overBudgetDays = Object.keys(dailyCosts).filter(dateStr => dailyCosts[dateStr] > dailyBudgetCap);

    return res.status(200).json({
      data: {
        tripId: trip.id,
        tripName: trip.name,
        totalBudget: totalBudgetNum > 0 ? totalBudgetNum : null,
        totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(2)),
        breakdown: {
          transport: parseFloat(breakdown.transport.toFixed(2)),
          stay: parseFloat(breakdown.stay.toFixed(2)),
          activities: parseFloat(breakdown.activities.toFixed(2)),
          meals: parseFloat(breakdown.meals.toFixed(2)),
          other: parseFloat(breakdown.other.toFixed(2)),
        },
        averageCostPerDay,
        totalDays,
        overBudgetDays,
        expenses: tripExpenses.map(e => ({
          id: e.id,
          tripId: e.tripId,
          tripStopId: e.tripStopId,
          category: e.category,
          label: e.label,
          amount: parseFloat(e.amount),
          createdAt: e.createdAt,
        }))
      }
    });
  } catch (err) {
    console.error('Error calculating budget:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to calculate budget.' }
    });
  }
};

// POST /api/v1/trips/:tripId/expenses
const addExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.params;
    const { label, category = 'other', amount, tripStopId } = req.body;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    if (!label || amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Expense label and a valid non-negative amount are required.' }
      });
    }

    const [created] = await db
      .insert(expenses)
      .values({
        tripId,
        tripStopId: tripStopId || null,
        category: ['transport', 'stay', 'activities', 'meals', 'other'].includes(category) ? category : 'other',
        label: label.trim(),
        amount: String(amount),
      })
      .returning();

    return res.status(201).json({ data: created });
  } catch (err) {
    console.error('Error adding expense:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add expense.' }
    });
  }
};

// DELETE /api/v1/trips/:tripId/expenses/:expenseId
const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId, expenseId } = req.params;

    const trip = await verifyTripOwnership(tripId, userId);
    if (!trip) {
      return res.status(404).json({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip not found or unauthorized.' }
      });
    }

    await db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.tripId, tripId)));
    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting expense:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete expense.' }
    });
  }
};

module.exports = {
  getBudget,
  addExpense,
  deleteExpense,
};
