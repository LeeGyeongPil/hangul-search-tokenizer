// Copy into .vitepress/config.mts of your VitePress site (npm install hangul-search-tokenizer).
// This file is a snippet: VitePress is not a dependency of this repository.
import { defineConfig } from 'vitepress';
import { vitepressSearch } from 'hangul-search-tokenizer/vitepress';

export default defineConfig({
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        // tokenize/processTerm/prefix/fuzzy are self-contained functions, so VitePress can
        // serialize them with fn.toString() and run them in the browser.
        miniSearch: vitepressSearch(),
      },
    },
  },
});
