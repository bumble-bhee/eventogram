const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addUsernames() {
  const users = await prisma.user.findMany({
    where: { username: null }
  });

  console.log(`Found ${users.length} users without username`);

  for (const user of users) {
    let baseUsername = user.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    let username = baseUsername;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { username }
    });

    console.log(`✅ ${user.name} → @${username}`);
  }

  console.log('Done!');
  await prisma.$disconnect();
}

addUsernames().catch(console.error);