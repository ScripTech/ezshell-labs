import { db } from './index'
import { instructors } from './schemas'
import { nanoid } from 'nanoid'

export async function seedInstructors() {
  const defaultInstructors = [
    {
      id: nanoid(),
      name: "Edilson D. Mucanze",
      title: "Senior DevOps Engineer & Cloud Solutions Architect",
      bio: "Edilson is an experienced DevOps engineer and cloud solutions architect with expertise in AWS, Linux systems, and containerization technologies. He has led multiple cloud migration projects and specializes in building scalable, secure infrastructure solutions for enterprise environments.",
      avatar: "https://media.licdn.com/dms/image/v2/D4D03AQFGJ30dWLkozA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729767497020?e=1757548800&v=beta&t=4CZ2Ihxgnrtl1wsRfDtdafhqiQzL8e-YeSYmykxzSrA",
      email: "edilson@ezshell-labs.com",
      experience: "8+ years",
      specializations: ["DevOps", "AWS", "Linux", "Docker", "Kubernetes", "CI/CD"],
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/edilson-d-mucanze-550707b8/",
        github: "https://github.com/edilson",
        website: "https://edilson.dev"
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]

  try {
    console.log('Seeding instructors...')
    await db.insert(instructors).values(defaultInstructors)
    console.log('Instructors seeded successfully!')
  } catch (error) {
    console.error('Error seeding instructors:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedInstructors()
    .then(() => {
      console.log('Seeding complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}
