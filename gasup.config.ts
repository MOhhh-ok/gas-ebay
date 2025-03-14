import { Config } from "gasup";

const config: Config = {
  bundleEntries: ['testSrc/index.ts'],
  bundleOutfile: 'testDist/bundle.js',
  srcDir: 'testSrc',
  distDir: 'testDist',
}


export default config;