// Seed script to populate Neon database with initial data
import 'dotenv/config';
import { db } from './db';
import { writings, albums, tags } from '../shared/schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await db.delete(writings);
    await db.delete(albums);
    await db.delete(tags);

    // Seed writings
    const mockWritings = [
      {
        title: 'Amintiri din Copilărie',
        type: 'Poezie',
        content: '<p>Casa bunicilor avea mirosul acela special, de lemn vechi și pâine caldă...</p><p>Mașina timpului era mai simplă decât își imaginau oamenii: un cadru metalic cu niște butoane și o antenă ridicolă. Nu era necesară multă tehnologie pentru a călători prin timp, doar foarte multă energie. Un miliard de jouli, pentru a fi precis.</p>',
        excerpt: 'Casa bunicilor avea mirosul acela special, de lemn vechi și pâine caldă...',
        wordCount: 108,
        dateWritten: '2024-08-20',
        lastModified: '2024-08-20',
        tags: ['copilărie', 'memorie', 'nostalgie'],
        mood: 'Nostalgic',
        isPrivate: false,
        published: true,
        deletedAt: null
      },
      {
        title: 'Cafeineaua de pe Colt',
        type: 'Poezie',
        content: '<p>Cafeineaua de pe colt avea ceva special. Nu era mâncarea (deși plăcinta de mere era divină), nici prețurile. Era atmosfera.</p>',
        excerpt: 'Cafeineaua de pe colt avea ceva special...',
        wordCount: 44,
        dateWritten: '2024-08-15',
        lastModified: '2024-08-15',
        tags: ['urban', 'observații'],
        mood: 'Contemplativ',
        isPrivate: false,
        published: true,
        deletedAt: null
      },
      {
        title: 'Soapte de Vânt',
        type: 'Poezie',
        content: '<p>Vântul șoptește prin frunze,<br>Povestind taine uitate,<br>Sub cerul înstelat de toamnă,<br>Inima mea e captivată.</p>',
        excerpt: 'Vântul șoptește prin frunze, Povestind taine uitate...',
        wordCount: 42,
        dateWritten: '2024-07-23',
        lastModified: '2024-07-23',
        tags: ['natură', 'poezie'],
        mood: 'Melancolic',
        isPrivate: false,
        published: true,
        deletedAt: null
      },
      {
        title: 'Zborul Pescărușului',
        type: 'Povestire',
        content: '<p>Pescărușul survolează marea cu ușurință, aripile sale albe strălucind în soarele dimineții. Valurile îi cântă o simfonie veche, iar el răspunde cu strigate vesele.</p>',
        excerpt: 'Pescărușul survolează marea cu ușurință...',
        wordCount: 51,
        dateWritten: '2024-06-30',
        lastModified: '2024-06-30',
        tags: ['mare', 'libertate'],
        mood: 'Vesel',
        isPrivate: false,
        published: true,
        deletedAt: null
      },
      {
        title: 'Marea și Visurile',
        type: 'Poezie',
        content: '<p>Marea cântă mereu aceeași melodie, dar nu suntem niciodată pregătiți s-o auzim cu adevărat. Valurile vin și pleacă, ca și visurile noastre - unele ajung la țărm, altele se pierd în adâncuri.</p>',
        excerpt: 'Marea cântă mereu aceeași melodie...',
        wordCount: 76,
        dateWritten: '2024-07-08',
        lastModified: '2024-07-08',
        tags: ['mare', 'filozofie', 'vise'],
        mood: 'Contemplativ',
        isPrivate: false,
        published: true,
        deletedAt: null
      },
      {
        title: 'Călătoria prin Timp',
        type: 'Povestire',
        content: '<p>Mașina timpului era mai simplă decât își imaginau oamenii: un cadru metalic cu niște butoane și o antenă ridicolă. Nu era necesară multă tehnologie pentru a călători prin timp, doar foarte multă energie.</p>',
        excerpt: 'Mașina timpului era mai simplă decât își imaginau...',
        wordCount: 89,
        dateWritten: '2024-05-12',
        lastModified: '2024-05-12',
        tags: ['sci-fi', 'aventură'],
        mood: 'Pasional',
        isPrivate: true,
        published: false,
        deletedAt: null
      }
    ];

    const insertedWritings = await db.insert(writings).values(mockWritings).returning();
    console.log(`✅ Inserted ${insertedWritings.length} writings`);

    // Seed albums
    const mockAlbums = [
      {
        name: 'Poezii Favorite',
        color: '#EC4899',
        icon: 'Heart',
        itemIds: [insertedWritings[0].id, insertedWritings[2].id, insertedWritings[4].id]
      },
      {
        name: 'Povestiri Scurte',
        color: '#10B981',
        icon: 'Book',
        itemIds: [insertedWritings[3].id]
      },
      {
        name: 'Eseuri Personale',
        color: '#3B82F6',
        icon: 'FileText',
        itemIds: []
      }
    ];

    const insertedAlbums = await db.insert(albums).values(mockAlbums).returning();
    console.log(`✅ Inserted ${insertedAlbums.length} albums`);

    // Seed tags
    const mockTags = [
      { name: 'copilărie', type: 'Poezie', sentiment: 'positive' },
      { name: 'natură', type: 'Poezie', sentiment: 'neutral' },
      { name: 'mare', type: 'Poezie', sentiment: 'positive' },
      { name: 'sci-fi', type: 'Povestire', sentiment: 'neutral' },
      { name: 'filozofie', type: 'Poezie', sentiment: 'contemplative' }
    ];

    const insertedTags = await db.insert(tags).values(mockTags).returning();
    console.log(`✅ Inserted ${insertedTags.length} tags`);

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
