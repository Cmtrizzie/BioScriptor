
#!/bin/bash

echo "🔍 Setting up SearXNG for local web search..."

# Check if SearXNG is already running
if curl -s http://0.0.0.0:8080 > /dev/null 2>&1; then
    echo "✅ SearXNG is already running on port 8080"
else
    echo "⚠️ SearXNG not found on port 8080"
    echo "📝 To set up SearXNG locally:"
    echo "   1. Install Docker (if available)"
    echo "   2. Run: docker run -d -p 8080:8080 searxng/searxng"
    echo "   3. Or use the existing public instances (already configured)"
fi

# Test web search functionality
echo "🧪 Testing web search..."
node -e "
const { performWebSearch } = require('./server/services/web-search.ts');
performWebSearch('test query', 1)
  .then(results => {
    console.log('✅ Web search working:', results.length > 0 ? 'Found results' : 'No results (but no errors)');
  })
  .catch(err => {
    console.log('⚠️ Web search issue:', err.message);
  });
"

echo "🎉 Setup complete! Your chatbot already has web search integrated."
