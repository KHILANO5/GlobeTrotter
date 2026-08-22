const {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  numeric,
  integer,
  date,
  time,
  uniqueIndex,
  index,
} = require('drizzle-orm/pg-core');

// ─── Enums ─────────────────────────────────────────────────────────────────

const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

const tripStatusEnum = pgEnum('trip_status', ['upcoming', 'ongoing', 'completed']);

const stopTypeEnum = pgEnum('stop_type', ['city_stop', 'travel', 'lodging', 'activity_block']);

const activityCategoryEnum = pgEnum('activity_category', [
  'sightseeing',
  'food',
  'adventure',
  'culture',
  'nightlife',
  'relaxation',
  'other',
]);

const expenseCategoryEnum = pgEnum('expense_category', [
  'transport',
  'stay',
  'activities',
  'meals',
  'other',
]);

// ─── users ─────────────────────────────────────────────────────────────────

const users = pgTable('users', {
  id:                  uuid('id').defaultRandom().primaryKey(),
  email:               varchar('email', { length: 255 }).notNull().unique(),
  passwordHash:        varchar('password_hash', { length: 255 }).notNull(),
  firstName:           varchar('first_name', { length: 100 }).notNull(),
  lastName:            varchar('last_name', { length: 100 }).notNull(),
  username:            varchar('username', { length: 50 }).notNull().unique(),
  phoneNumber:         varchar('phone_number', { length: 30 }),
  city:                varchar('city', { length: 100 }),
  country:             varchar('country', { length: 100 }),
  photoUrl:            text('photo_url'),
  languagePreference:  varchar('language_preference', { length: 10 }).default('en').notNull(),
  role:                userRoleEnum('role').default('user').notNull(),
  // Auth-module fields retained from original schema
  isVerified:          boolean('is_verified').default(false).notNull(),
  verificationCode:    varchar('verification_code', { length: 6 }),
  resetPasswordCode:   varchar('reset_password_code', { length: 6 }),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
  deletedAt:           timestamp('deleted_at'),
});

// ─── password_reset_tokens ─────────────────────────────────────────────────

const passwordResetTokens = pgTable('password_reset_tokens', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt:    timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── cities ────────────────────────────────────────────────────────────────

const cities = pgTable('cities', {
  id:              uuid('id').defaultRandom().primaryKey(),
  name:            varchar('name', { length: 150 }).notNull(),
  country:         varchar('country', { length: 100 }).notNull(),
  region:          varchar('region', { length: 100 }),
  costIndex:       numeric('cost_index', { precision: 6, scale: 2 }),
  popularityScore: integer('popularity_score').default(0).notNull(),
  imageUrl:        text('image_url'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  countryIdx: index('cities_country_idx').on(table.country),
}));

// ─── activities ────────────────────────────────────────────────────────────

const activities = pgTable('activities', {
  id:                       uuid('id').defaultRandom().primaryKey(),
  cityId:                   uuid('city_id').references(() => cities.id, { onDelete: 'set null' }),
  name:                     varchar('name', { length: 200 }).notNull(),
  description:              text('description'),
  category:                 activityCategoryEnum('category').default('other').notNull(),
  estimatedCost:            numeric('estimated_cost', { precision: 10, scale: 2 }).default('0').notNull(),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  imageUrl:                 text('image_url'),
  createdAt:                timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cityIdCategoryIdx: index('activities_city_id_category_idx').on(table.cityId, table.category),
}));

// ─── trips ─────────────────────────────────────────────────────────────────

const trips = pgTable('trips', {
  id:            uuid('id').defaultRandom().primaryKey(),
  userId:        uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:          varchar('name', { length: 200 }).notNull(),
  description:   text('description'),
  coverPhotoUrl: text('cover_photo_url'),
  startDate:     date('start_date').notNull(),
  endDate:       date('end_date').notNull(),
  status:        tripStatusEnum('status').default('upcoming').notNull(),
  totalBudget:   numeric('total_budget', { precision: 10, scale: 2 }),
  isPublic:      boolean('is_public').default(false).notNull(),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
  deletedAt:     timestamp('deleted_at'),
}, (table) => ({
  userIdStatusIdx: index('trips_user_id_status_idx').on(table.userId, table.status),
  isPublicIdx:     index('trips_is_public_idx').on(table.isPublic),
}));

// ─── trip_stops ────────────────────────────────────────────────────────────

const tripStops = pgTable('trip_stops', {
  id:          uuid('id').defaultRandom().primaryKey(),
  tripId:      uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  cityId:      uuid('city_id').references(() => cities.id, { onDelete: 'set null' }),
  type:        stopTypeEnum('type').default('city_stop').notNull(),
  title:       varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  startDate:   date('start_date').notNull(),
  endDate:     date('end_date').notNull(),
  budget:      numeric('budget', { precision: 10, scale: 2 }),
  sortOrder:   integer('sort_order').default(0).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tripIdSortIdx: index('trip_stops_trip_id_sort_order_idx').on(table.tripId, table.sortOrder),
}));

// ─── trip_stop_activities ──────────────────────────────────────────────────

const tripStopActivities = pgTable('trip_stop_activities', {
  id:           uuid('id').defaultRandom().primaryKey(),
  tripStopId:   uuid('trip_stop_id').notNull().references(() => tripStops.id, { onDelete: 'cascade' }),
  activityId:   uuid('activity_id').notNull().references(() => activities.id),
  scheduledDate: date('scheduled_date'),
  scheduledTime: time('scheduled_time'),
  costOverride: numeric('cost_override', { precision: 10, scale: 2 }),
  sortOrder:    integer('sort_order').default(0).notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique: an activity can't be added twice to the same stop
  stopActivityUniq:  uniqueIndex('trip_stop_activities_stop_activity_uniq').on(table.tripStopId, table.activityId),
  stopIdSortIdx:     index('trip_stop_activities_stop_id_sort_idx').on(table.tripStopId, table.sortOrder),
}));

// ─── expenses ──────────────────────────────────────────────────────────────

const expenses = pgTable('expenses', {
  id:         uuid('id').defaultRandom().primaryKey(),
  tripId:     uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  tripStopId: uuid('trip_stop_id').references(() => tripStops.id, { onDelete: 'set null' }),
  category:   expenseCategoryEnum('category').default('other').notNull(),
  label:      varchar('label', { length: 200 }).notNull(),
  amount:     numeric('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tripIdCategoryIdx: index('expenses_trip_id_category_idx').on(table.tripId, table.category),
}));

// ─── trip_shares ───────────────────────────────────────────────────────────

const tripShares = pgTable('trip_shares', {
  id:         uuid('id').defaultRandom().primaryKey(),
  tripId:     uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }).unique(),
  shareToken: varchar('share_token', { length: 64 }).notNull().unique(),
  createdBy:  uuid('created_by').notNull().references(() => users.id),
  viewCount:  integer('view_count').default(0).notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  revokedAt:  timestamp('revoked_at'),
});

// ─── trip_copies ───────────────────────────────────────────────────────────

const tripCopies = pgTable('trip_copies', {
  id:           uuid('id').defaultRandom().primaryKey(),
  sourceTripId: uuid('source_trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  copiedTripId: uuid('copied_trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }).unique(),
  copiedBy:     uuid('copied_by').notNull().references(() => users.id),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

// ─── saved_destinations ────────────────────────────────────────────────────

const savedDestinations = pgTable('saved_destinations', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cityId:    uuid('city_id').notNull().references(() => cities.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userCityUniq: uniqueIndex('saved_destinations_user_city_uniq').on(table.userId, table.cityId),
}));

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Enums
  userRoleEnum,
  tripStatusEnum,
  stopTypeEnum,
  activityCategoryEnum,
  expenseCategoryEnum,
  // Tables
  users,
  passwordResetTokens,
  cities,
  activities,
  trips,
  tripStops,
  tripStopActivities,
  expenses,
  tripShares,
  tripCopies,
  savedDestinations,
};
