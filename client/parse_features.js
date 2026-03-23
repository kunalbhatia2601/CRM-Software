const fs = require('fs');
const html = fs.readFileSync('taskgo.html', 'utf8');

const regex = /<h3[^>]*>(.*?)<\/h3>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log("Heading: " + match[1]);
}

const imgRegex = /<img[^>]*src="([^"]+)"[^>]*>/g;
let imgMatch;
while ((imgMatch = imgRegex.exec(html)) !== null) {
  if(imgMatch[1].includes('cdn.prod.website') && !imgMatch[1].includes('Logo')) {
    console.log("Image: " + imgMatch[1]);
  }
}
