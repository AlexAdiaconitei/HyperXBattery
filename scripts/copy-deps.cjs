const fs = require('fs');
const path = require('path');

const src = 'node_modules';
const dst = 'com.alexadiaconitei.hyperxbattery.sdPlugin/node_modules';

// List of dependencies to copy
const dependencies = [
  'hyperx-cloud-flight-wireless',
  'node-hid',
  'eventemitter3',
  'pkg-prebuilds'
];

// Remove existing node_modules in plugin directory
if (fs.existsSync(dst)) {
  console.log('Removing existing node_modules...');
  fs.rmSync(dst, { recursive: true });
}

// Create plugin node_modules directory
console.log('Creating node_modules directory...');
fs.mkdirSync(dst, { recursive: true });

// Copy each dependency
dependencies.forEach(module => {
  const srcPath = path.join(src, module);
  const dstPath = path.join(dst, module);

  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${module}...`);
    fs.cpSync(srcPath, dstPath, { recursive: true });
  } else {
    console.warn(`Warning: ${module} not found in node_modules`);
  }
});

console.log('Dependencies copied successfully!');
