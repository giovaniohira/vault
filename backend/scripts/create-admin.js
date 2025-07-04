import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.error('Usage: node create-admin.js <email>');
      console.error('Example: node create-admin.js admin@example.com');
      process.exit(1);
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      console.error('Please register the user first, then run this script.');
      process.exit(1);
    }

    // Update user role to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'admin' }
    });

    console.log(`✅ User ${updatedUser.username} (${updatedUser.email}) has been promoted to admin.`);
    console.log('You can now access the audit dashboard.');
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 