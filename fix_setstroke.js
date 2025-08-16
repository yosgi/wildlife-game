const fs = require('fs');

const filePath = './lib/game/scenes/BackpackScene.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix all .setStroke() calls by replacing them with proper border creation
const patterns = [
  // Pattern 1: Basic rectangle with setStroke
  {
    regex: /const\s+(\w+)\s*=\s*this\.add\.rectangle\(([^)]+)\)\.setStroke\(([^,]+),\s*([^)]+)\)/g,
    replacement: (match, varName, rectParams, color, width) => {
      return `const ${varName} = this.add.rectangle(${rectParams})
    const ${varName}Border = this.add.rectangle(${rectParams.split(',').slice(0,4).join(',')}, 0x000000, 0).setStrokeStyle(${width}, ${color})`;
    }
  },
  // Pattern 2: Chained rectangle with setStroke
  {
    regex: /\.rectangle\(([^)]+)\)\.setStroke\(([^,]+),\s*([^)]+)\)/g,
    replacement: (match, rectParams, color, width) => {
      const params = rectParams.split(',').map(p => p.trim());
      const bgParams = params.join(', ');
      const borderParams = params.slice(0,4).join(', ') + ', 0x000000, 0';
      return `.rectangle(${bgParams})
    const tempBorder = this.add.rectangle(${borderParams}).setStrokeStyle(${width}, ${color})`;
    }
  }
];

// Apply replacements
patterns.forEach(pattern => {
  content = content.replace(pattern.regex, pattern.replacement);
});

// Fix remaining setStroke calls that are standalone
content = content.replace(
  /(\w+)\.setStroke\(([^,]+),\s*([^)]+)\)/g,
  '$1Border.setStrokeStyle($3, $2)'
);

fs.writeFileSync(filePath, content);
console.log('Fixed setStroke calls in BackpackScene.ts');
