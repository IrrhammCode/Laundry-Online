// Vercel build script to inject environment variables into HTML files
const fs = require('fs');
const path = require('path');

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('Starting build script...');
console.log('API_URL:', API_URL);

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        content = content.replace(/%VITE_API_URL%/g, API_URL);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
        // Don't throw, continue with other files
    }
}

function processDirectory(dir) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            // Skip node_modules and other build directories
            if (file === 'node_modules' || file === '.git' || file.startsWith('.')) {
                return;
            }
            
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    processDirectory(filePath);
                } else if (file.endsWith('.html')) {
                    replaceInFile(filePath);
                }
            } catch (error) {
                // Skip files that can't be accessed
                console.warn(`Skipping ${filePath}:`, error.message);
            }
        });
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
        throw error;
    }
}

// Process apps/web directory
const webDir = path.join(__dirname, 'apps', 'web');
console.log('Looking for web directory at:', webDir);

if (fs.existsSync(webDir)) {
    console.log('Found web directory, processing...');
    processDirectory(webDir);
    console.log('Build complete: Environment variables injected');
    process.exit(0);
} else {
    console.error('apps/web directory not found at:', webDir);
    console.log('Current directory:', __dirname);
    console.log('Trying alternative paths...');
    
    // Try alternative paths
    const altPaths = [
        path.join(__dirname, 'web'),
        path.join(process.cwd(), 'apps', 'web'),
        path.join(process.cwd(), 'web')
    ];
    
    let found = false;
    for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
            console.log('Found web directory at:', altPath);
            processDirectory(altPath);
            console.log('Build complete: Environment variables injected');
            found = true;
            break;
        }
    }
    
    if (!found) {
        console.error('Could not find web directory in any expected location');
        process.exit(1);
    }
}

