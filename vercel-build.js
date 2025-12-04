// Vercel build script to inject environment variables into HTML files
const fs = require('fs');
const path = require('path');

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/%VITE_API_URL%/g, API_URL);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
    }
}

function processDirectory(dir) {
    const files = fs.readDirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('.html')) {
            replaceInFile(filePath);
        }
    });
}

// Process apps/web directory
const webDir = path.join(__dirname, 'apps', 'web');
if (fs.existsSync(webDir)) {
    processDirectory(webDir);
    console.log('Build complete: Environment variables injected');
} else {
    console.error('apps/web directory not found');
}

