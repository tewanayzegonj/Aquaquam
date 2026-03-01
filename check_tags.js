import fs from 'fs';

const content = fs.readFileSync('components/AudioPlayer.tsx', 'utf8');
// Match all opening tags that are NOT self-closing
// We use a single regex on the whole content to handle multi-line tags
const openingTags = content.match(/<div(?![^>]*\/>)/g) || [];
const closingTags = content.match(/<\/div>/g) || [];

console.log(`Opening tags: ${openingTags.length}`);
console.log(`Closing tags: ${closingTags.length}`);
console.log(`Final balance: ${openingTags.length - closingTags.length}`);
