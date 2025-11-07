import 'dotenv/config';
import { db } from './db.js';
import { albums } from '../shared/schema.js';
import { inArray, eq } from 'drizzle-orm';

async function main() {
  const namesToDelete = ['Desene', 'Picturi', 'Peisaje', 'Portrete', 'Portofoliu mixt'];
  console.log('Cleaning TA-created albums from DB:', namesToDelete.join(', '));

  const existing = await db.select().from(albums).where(inArray(albums.name, namesToDelete));
  if (!existing.length) {
    console.log('No matching albums found. Nothing to delete.');
    return;
  }

  console.log(`Found ${existing.length} album(s) to delete:`, existing.map(a => `${a.id}:${a.name}`).join(', '));

  // Delete by id to be explicit
  for (const a of existing) {
    await db.delete(albums).where(eq(albums.id, a.id));
    console.log(`Deleted album id=${a.id} name="${a.name}"`);
  }

  console.log('Cleanup complete.');
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
