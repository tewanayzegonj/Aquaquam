import fs from 'fs';

const content = fs.readFileSync('components/AudioPlayer.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
lines.forEach((line, i) => {
    if (i + 1 < 1246 || i + 1 > 1393) return;
    const tags = line.match(/<div|<\/div/g);
    if (tags) {
        tags.forEach(tag => {
            if (tag === '<div') balance++;
            else balance--;
        });
    }
});
console.log(`Controls Section balance: ${balance}`);
