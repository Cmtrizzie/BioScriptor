
import { performWebSearch, formatSearchResults, shouldPerformWebSearch } from '../web-search';

describe('Web Search Service', () => {
  describe('shouldPerformWebSearch', () => {
    it('should return true for queries that benefit from web search', () => {
      expect(shouldPerformWebSearch('what is CRISPR latest research')).toBe(true);
      expect(shouldPerformWebSearch('how to use BioPython')).toBe(true);
      expect(shouldPerformWebSearch('recent COVID variants 2024')).toBe(true);
      expect(shouldPerformWebSearch('protein folding news')).toBe(true);
    });

    it('should return false for general queries', () => {
      expect(shouldPerformWebSearch('hello')).toBe(false);
      expect(shouldPerformWebSearch('calculate molecular weight')).toBe(false);
      expect(shouldPerformWebSearch('simple math problem')).toBe(false);
    });
  });

  describe('formatSearchResults', () => {
    it('should format search results correctly', () => {
      const results = [
        {
          title: 'Test Result',
          url: 'https://example.com',
          snippet: 'This is a test snippet'
        }
      ];

      const formatted = formatSearchResults(results);
      expect(formatted).toContain('Web Search Results');
      expect(formatted).toContain('Test Result');
      expect(formatted).toContain('This is a test snippet');
    });

    it('should handle empty results', () => {
      const formatted = formatSearchResults([]);
      expect(formatted).toContain('No web search results found');
    });
  });

  describe('performWebSearch', () => {
    it('should handle API failures gracefully', async () => {
      // This test will use the fallback method since no real API key
      const results = await performWebSearch('test query');
      expect(Array.isArray(results)).toBe(true);
      // Should not throw an error even if APIs fail
    });
  });
});
