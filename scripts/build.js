/**
 * GlamStickyNote Build Script
 * Creates a minified production build in /dist
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('🚀 Starting build process...\n');

// ========================================
// Helper Functions
// ========================================
function cleanDist() {
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(DIST_DIR, 'css'), { recursive: true });
    fs.mkdirSync(path.join(DIST_DIR, 'js'), { recursive: true });
    console.log('📂 Cleaned dist folder');
}

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// ========================================
// Minifiers (SAFE MODE)
// ========================================
function minifyCSS(content) {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '')           // Remove block comments
        .replace(/\s+/g, ' ')                        // Collapse whitespace
        .replace(/\s*([{}:;,])\s*/g, '$1')          // Remove space around delimiters
        .replace(/;}/g, '}')                         // Remove trailing semicolons
        .trim();
}

function minifyJS(content) {
    // SAFE: Only remove block comments, preserve line structure
    let code = content.replace(/\/\*[\s\S]*?\*\//g, '');

    return code
        .split('\n')
        .map(line => {
            const trimmed = line.trim();
            // Remove full-line comments (but NOT inline to avoid breaking URLs)
            if (trimmed.startsWith('//')) return '';
            return line.trimEnd(); // Keep indentation, just remove trailing whitespace
        })
        .filter(line => line.trim().length > 0)  // Remove empty lines
        .join('\n');
}

// ========================================
// Build Process
// ========================================
function build() {
    try {
        cleanDist();

        // 1. Minify CSS
        const cssPath = path.join(ROOT_DIR, 'css', 'styles.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const minCSS = minifyCSS(cssContent);
        fs.writeFileSync(path.join(DIST_DIR, 'css', 'styles.min.css'), minCSS);
        const cssReduction = ((1 - minCSS.length / cssContent.length) * 100).toFixed(1);
        console.log(`✨ CSS: ${cssContent.length} → ${minCSS.length} bytes (${cssReduction}% smaller)`);

        // 2. JS (App & Icons)
        console.log('✨ Minifying JS...');

        // Icons.js
        const iconsPath = path.join(ROOT_DIR, 'js', 'icons.js');
        const iconsContent = fs.readFileSync(iconsPath, 'utf8');
        const minIcons = minifyJS(iconsContent);
        fs.writeFileSync(path.join(DIST_DIR, 'js', 'icons.min.js'), minIcons);

        // App.js
        const jsPath = path.join(ROOT_DIR, 'js', 'app.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        const minJS = minifyJS(jsContent);
        fs.writeFileSync(path.join(DIST_DIR, 'js', 'app.min.js'), minJS);
        const jsReduction = ((1 - minJS.length / jsContent.length) * 100).toFixed(1);
        console.log(`✨ JS:  ${jsContent.length} → ${minJS.length} bytes (${jsReduction}% smaller)`);

        // 3. Update and copy index.html
        let htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
        htmlContent = htmlContent.replace('href="css/styles.css"', 'href="css/styles.min.css"');
        htmlContent = htmlContent.replace('src="js/icons.js"', 'src="js/icons.min.js"');
        htmlContent = htmlContent.replace('src="js/app.js"', 'src="js/app.min.js"');
        fs.writeFileSync(path.join(DIST_DIR, 'index.html'), htmlContent);
        console.log('📝 Updated index.html');

        // 4. Update and copy sw.js (Service Worker)
        let swContent = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
        // Update paths in SW
        swContent = swContent.replace("'./css/styles.css'", "'./css/styles.min.css'");
        swContent = swContent.replace("'./js/icons.js'", "'./js/icons.min.js'");
        swContent = swContent.replace("'./js/app.js'", "'./js/app.min.js'");

        // Minify SW
        const minSW = minifyJS(swContent);
        fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), minSW);
        console.log('⚙️  Updated sw.js');

        // 5. Copy assets folder
        copyDir(path.join(ROOT_DIR, 'assets'), path.join(DIST_DIR, 'assets'));
        console.log('🖼️  Copied assets');

        // 6. Copy manifest.json
        fs.copyFileSync(
            path.join(ROOT_DIR, 'manifest.json'),
            path.join(DIST_DIR, 'manifest.json')
        );
        console.log('📋 Copied manifest.json');

        console.log('\n✅ Build complete! Production files in /dist');
        console.log('   To test: serve the dist folder with a local server');

    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

build();
