const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const isDryRun = process.argv.includes('--dry-run');
    
    console.log(`Starting swapped student detection... (Dry Run: ${isDryRun})`);

    const students = await prisma.student.findMany();
    let swappedCount = 0;
    const toFix = [];

    for (const s of students) {
        // Validation logic
        // rollNumber is likely swapped if it has NO numbers, or has spaces
        // name is likely swapped if it HAS numbers
        const rollHasNumber = /[0-9]/.test(s.rollNumber);
        const nameHasNumber = /[0-9]/.test(s.name);
        
        // A clear swap: Roll doesn't have a number, but Name does.
        const isSwapped = !rollHasNumber && nameHasNumber;

        if (isSwapped) {
            swappedCount++;
            console.log(`[SWAPPED DETECTED] ID: ${s.id}`);
            console.log(`  Current Roll: "${s.rollNumber}" -> Should be: "${s.name}"`);
            console.log(`  Current Name: "${s.name}" -> Should be: "${s.rollNumber}"`);
            
            toFix.push(s);
        }
    }

    console.log(`\nTotal swapped records found: ${swappedCount} out of ${students.length} students.`);

    if (isDryRun) {
        console.log('\nRun without --dry-run to apply fixes.');
        process.exit(0);
    }

    if (swappedCount > 0) {
        console.log('\nApplying fixes...');
        for (const s of toFix) {
            try {
                // Since rollNumber is unique, we must be careful with unique constraint violations during swap.
                // We'll update them directly.
                await prisma.student.update({
                    where: { id: s.id },
                    data: {
                        rollNumber: s.name,
                        name: s.rollNumber,
                        misNumber: s.name // Also update misNumber if it was wrong
                    }
                });
                console.log(`Fixed student ID: ${s.id}`);
            } catch (err) {
                console.error(`Failed to fix student ID: ${s.id}. Error: ${err.message}`);
            }
        }
        console.log('Fixes applied successfully.');
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
