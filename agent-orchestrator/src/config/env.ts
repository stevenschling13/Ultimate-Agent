interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  openaiApiKey: string;
}

function validateEnv(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  const port = parseInt(process.env.PORT || '3000', 10);
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const errors: string[] = [];

  if (!openaiApiKey) {
    errors.push('OPENAI_API_KEY is required but not set');
  }

  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`PORT must be a valid number between 1 and 65535, got: ${process.env.PORT}`);
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n💡 Please check your .env file or environment variables.');
    console.error('   See README.md for configuration instructions.');
    process.exit(1);
  }

  return {
    nodeEnv,
    port,
    openaiApiKey: openaiApiKey!
  };
}

export const config = validateEnv();

export function logConfig(): void {
  console.log('📋 Configuration loaded:');
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Port: ${config.port}`);
  console.log(`  - OpenAI API Key: ${config.openaiApiKey ? '✓ Configured (hidden)' : '✗ Missing'}`);
}
