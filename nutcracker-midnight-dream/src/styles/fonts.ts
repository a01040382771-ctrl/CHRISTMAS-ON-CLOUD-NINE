import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const TITLE_FONT = 'IM Fell English';
export const SERIF_FONT = 'Cormorant Garamond';

let loaded: Promise<unknown> | null = null;
export const loadStoryFonts = () => {
  if (!loaded) {
    loaded = Promise.all([
      loadFont({family: TITLE_FONT, url: staticFile('fonts/im-fell-english-latin-400-normal.woff2'), weight: '400'}),
      loadFont({family: TITLE_FONT, url: staticFile('fonts/im-fell-english-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
      loadFont({family: SERIF_FONT, url: staticFile('fonts/cormorant-garamond-latin-500-normal.woff2'), weight: '500'}),
      loadFont({family: SERIF_FONT, url: staticFile('fonts/cormorant-garamond-latin-600-italic.woff2'), weight: '600', style: 'italic'}),
    ]);
  }
  return loaded;
};
