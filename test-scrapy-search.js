
#!/usr/bin/env node

const { performWebSearch } = require('./server/services/web-search.js');

async function testScrapySearch() {
  console.log('🧪 Testing Scrapy Web Search Integration...\n');

  const testQueries = [
    'bioinformatics tools',
    'CRISPR gene editing',
    'protein folding research',
    'latest COVID variants'
  ];

  for (const query of testQueries) {
    console.log(`🔍 Testing query: "${query}"`);
    try {
      const results = await performWebSearch(query, 3);
      console.log(`✅ Found ${results.length} results:`);
      
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title}`);
        console.log(`     ${result.url}`);
        console.log(`     ${result.snippet.substring(0, 100)}...`);
        console.log('');
      });
    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error.message);
    }
    console.log('---\n');
  }
}

// Run the test
testScrapySearch().catch(console.error);
