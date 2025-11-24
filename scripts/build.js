import { spawn } from 'child_process';

async function buildTypeScript() {
  console.log('Building TypeScript...');

  const tscServer = spawn('npx', ['tsc', '-p', 'tsconfig.server.json'], {
    stdio: 'inherit',
    shell: true
  });

  console.log('Bundling Client with esbuild...');
  const esbuildClient = spawn('npx', [
    'esbuild',
    'src/client/index.ts',
    '--bundle',
    '--outfile=dist/client/index.js',
    '--format=esm',
    '--platform=browser',
    '--sourcemap'
  ], {
    stdio: 'inherit',
    shell: true
  });

  await Promise.all([
    new Promise((resolve, reject) => {
      tscServer.on('close', (code) => code === 0 ? resolve() : reject(new Error(`tsc server failed with code ${code}`)));
    }),
    new Promise((resolve, reject) => {
      esbuildClient.on('close', (code) => code === 0 ? resolve() : reject(new Error(`esbuild client failed with code ${code}`)));
    })
  ]);
}

async function build() {
  try {
    await buildTypeScript();

    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
