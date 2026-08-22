const { pgTable, serial, varchar, text, timestamp, boolean } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 50 }).default('USER').notNull(), // 'USER' or 'ADMIN'
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationCode: varchar('verification_code', { length: 6 }),
  resetPasswordCode: varchar('reset_password_code', { length: 6 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

module.exports = {
  users
};
