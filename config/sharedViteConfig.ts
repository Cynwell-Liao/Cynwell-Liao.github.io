import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readAppVersion } from './buildMetadata.ts'

const srcDirectory = fileURLToPath(new URL('../src', import.meta.url))

export const sharedViteConfig = {
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(readAppVersion()),
  },
  resolve: {
    alias: {
      '@app': path.join(srcDirectory, 'app'),
      '@features': path.join(srcDirectory, 'features'),
      '@shared': path.join(srcDirectory, 'shared'),
      '@content': path.join(srcDirectory, 'content'),
    },
  },
}
