const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function migrate() {
    console.log("Starting access migration...");
    try {
        // 1. Fetch all courses that have a faculty assigned
        const courses = await prisma.course.findMany({
            include: { faculty: true }
        });

        for (const course of courses) {
            // Also need to check if we can extract faculty name from teachingPlan settings if it's there
            let facultyName = course.faculty?.name || null;
            if (!facultyName && course.teachingPlan && typeof course.teachingPlan === 'object' && course.teachingPlan.course && course.teachingPlan.course.faculty) {
                facultyName = course.teachingPlan.course.faculty;
            }
            
            let facultyEmail = course.faculty?.email;
            
            if (!facultyName && !facultyEmail) continue;

            let user = null;
            if (facultyEmail) {
                user = await prisma.user.findUnique({ where: { email: facultyEmail } });
            }
            if (!user && facultyName) {
                // Try to find user by name
                user = await prisma.user.findFirst({ where: { name: facultyName } });
            }

            if (!user && (facultyEmail || facultyName)) {
                const email = facultyEmail || `${facultyName.toLowerCase().replace(/\s+/g, '.')}@teachflow.com`;
                const name = facultyName || email.split('@')[0];
                
                // Create the user if it doesn't exist to ensure no data is lost
                const existingByEmail = await prisma.user.findUnique({ where: { email } });
                
                if (!existingByEmail) {
                    const hashedPassword = await bcrypt.hash("password", 10);
                    user = await prisma.user.create({
                        data: {
                            email,
                            name,
                            password: hashedPassword,
                            role: "faculty",
                            status: "active"
                        }
                    });
                    console.log(`Created missing user: ${email}`);
                } else {
                    user = existingByEmail;
                }
            }

            if (user) {
                // Upsert CourseAccess
                await prisma.courseAccess.upsert({
                    where: {
                        userId_courseId: {
                            userId: user.id,
                            courseId: course.id
                        }
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        courseId: course.id,
                        accessLevel: "owner"
                    }
                });
                console.log(`Migrated access for Course ${course.code || course.courseId} -> User ${user.email}`);
            }
        }
        console.log("Migration completed successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
