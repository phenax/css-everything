const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: ['src/renderer.ts'],
    outfile: 'dist/renderer/index.js',
    bundle: true,
    sourcemap: true,
    minify: true,
    splitting: false,
    format: 'iife',
    target: ['es2015'],
  })
  .catch(e => (console.error(e), process.exit(1)))
