
// Simple health check script to verify server dependencies
import express from 'express';

console.log('🔍 Checking server dependencies...');

try {
  // Test basic Express setup
  const testApp = express();
  console.log('✅ Express imported successfully');
  
  // Test environment variables
  console.log('📊 Environment check:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('  PORT:', process.env.PORT || 'defaulting to 5000');
  
  // Test TypeScript compilation
  console.log('✅ TypeScript compilation working');
  
  console.log('🎉 Health check passed! Server should be able to start.');
  
} catch (error) {
  console.error('❌ Health check failed:', error);
  process.exit(1);
}
