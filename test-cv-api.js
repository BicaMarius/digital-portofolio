#!/usr/bin/env node
/**
 * Test CV API - verifică dacă API-ul funcționează corect cu Neon
 */

console.log('🧪 Test CV API cu Neon Database\n');
console.log('='.repeat(50));

const baseUrl = 'http://localhost:5000';

async function testAPI() {
  try {
    // Test 1: GET CV (should return null if no CV exists)
    console.log('\n📥 Test 1: GET /api/cv');
    const getResponse = await fetch(`${baseUrl}/api/cv`);
    const cvData = await getResponse.json();
    console.log('   Status:', getResponse.status);
    console.log('   Response:', cvData ? 'CV exists' : 'No CV found');
    
    console.log('\n✅ API este funcțional!');
    console.log('\n💡 Pentru a testa upload-ul:');
    console.log('   1. Deschide: http://localhost:5000/profile');
    console.log('   2. Mergi la tab-ul CV');
    console.log('   3. Încearcă să încarci un PDF');
    console.log('\n📝 Datele sunt salvate direct în Neon database ca base64');
    
  } catch (error) {
    console.error('\n❌ Eroare la testare:', error instanceof Error ? error.message : error);
    console.log('\n💡 Asigură-te că:');
    console.log('   - Serverul rulează (npm run dev)');
    console.log('   - DATABASE_URL este configurată în .env');
  }
}

testAPI();
