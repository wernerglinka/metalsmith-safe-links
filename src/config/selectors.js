/**
 * HTML element selectors and their URL attributes to process
 * @type {Array<{selector: string, attr: string, isAnchor: boolean}>}
 */
export const urlSelectors = [
  { selector: 'a[href]', attr: 'href', isAnchor: true },
  { selector: 'link[href]', attr: 'href', isAnchor: false },
  { selector: 'area[href]', attr: 'href', isAnchor: false },
  { selector: 'script[src]', attr: 'src', isAnchor: false },
  { selector: 'img[src]', attr: 'src', isAnchor: false },
  { selector: 'iframe[src]', attr: 'src', isAnchor: false },
  { selector: 'source[src]', attr: 'src', isAnchor: false },
  { selector: 'embed[src]', attr: 'src', isAnchor: false },
  { selector: 'track[src]', attr: 'src', isAnchor: false },
  { selector: 'form[action]', attr: 'action', isAnchor: false },
  { selector: 'object[data]', attr: 'data', isAnchor: false },
  { selector: 'video[poster]', attr: 'poster', isAnchor: false },
  { selector: 'meta[content]', attr: 'content', isAnchor: false }
];