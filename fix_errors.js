const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Find things like `error={errors.first_name?.message}` and add `as string`
    // Ensure we don't duplicate `as string`
    const regex = /error=\{errors\.([a-zA-Z0-9_]+)\?\.message\}(?!\s*as\s*string)/g;
    
    // Also handle nested ones like `errors.address?.city?.message`
    const regexNested = /error=\{errors\.([a-zA-Z0-9_]+)\?\.([a-zA-Z0-9_]+)\?\.message\}(?!\s*as\s*string)/g;
    
    let changed = false;
    
    if (regex.test(content)) {
        content = content.replace(regex, 'error={errors.$1?.message as string}');
        changed = true;
    }
    
    if (regexNested.test(content)) {
        content = content.replace(regexNested, 'error={errors.$1?.$2?.message as string}');
        changed = true;
    }
    
    // Check for standard errors without `?` like `errors.email.message`
    const regexNoQ = /error=\{errors\.([a-zA-Z0-9_]+)\.message\}(?!\s*as\s*string)/g;
    if (regexNoQ.test(content)) {
        content = content.replace(regexNoQ, 'error={errors.$1?.message as string}');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        changedCount++;
        console.log(`Fixed in ${file}`);
    }
});

console.log(`Total files changed: ${changedCount}`);
