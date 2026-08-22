const { db } = require('../config/db');
const { users } = require('./schema');
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');

async function seed() {
  console.log('Seeding database...');
  try {
    const adminEmail = 'admin@hackathon.com';
    
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await db.insert(users).values({
      fullName: 'Default Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true // Admin is verified by default
    });

    console.log('Admin user seeded successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log('Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
}

seed();
