import { db } from './index'
import { users } from './schemas'
import { eq } from 'drizzle-orm'

export async function updateAdminRole() {
  try {
    // Find the admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@ezshell.local')
    })

    if (!adminUser) {
      console.log('Admin user not found')
      return
    }

    console.log('Current admin user:', adminUser)

    // Update the role to admin
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, 'admin@ezshell.local'))
      .returning()

    console.log('Updated admin user:', updatedUser)
  } catch (error) {
    console.error('Error updating admin role:', error)
  }
}

// Run if called directly
if (require.main === module) {
  updateAdminRole()
    .then(() => {
      console.log('Role update complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Role update failed:', error)
      process.exit(1)
    })
}
