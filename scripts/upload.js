const fs = require('fs');
const { execSync } = require('child_process');

const CATBOX_API = 'https://catbox.moe/user/api.php';
const LITTERBOX_API = 'https://litterbox.catbox.moe/resources/internals/api.php';

const USE_LITTERBOX = process.argv[2] === 'litterbox';
const filename = process.argv[3] || 'merged_video.mp4';

if (!fs.existsSync(filename)) {
  console.error(`ERROR: File not found: ${filename}`);
  process.exit(1);
}

const stats = fs.statSync(filename);
console.log(`Uploading ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

const apiUrl = USE_LITTERBOX ? LITTERBOX_API : CATBOX_API;
console.log(`Uploading to: ${USE_LITTERBOX ? 'Litterbox' : 'Catbox'}`);

try {
  const absolutePath = fs.realpathSync(filename);
  
  const cmd = `curl -s -S -X POST "${apiUrl}" -F "reqtype=fileUpload" ${USE_LITTERBOX ? '-F "time=72h"' : ''} -F "fileToUpload=@${absolutePath}"`;
  
  console.log('Running curl command...');
  
  const response = execSync(cmd, { 
    maxBuffer: 50 * 1024 * 1024,
    timeout: 120000,
    encoding: 'utf8',
    shell: true
  });
  
  const result = response.trim();
  console.log('Raw response:', result);
  
  if (result && result.startsWith('https://')) {
    console.log('SUCCESS: Upload URL found');
    console.log('URL=' + result);
    process.exit(0);
  } else if (result.includes('error') || result.includes('Error')) {
    console.error('ERROR: Server returned error:', result);
    process.exit(1);
  } else {
    console.error('ERROR: Unexpected response:', result);
    process.exit(1);
  }
  
} catch (error) {
  console.error('EXCEPTION:', error.message);
  if (error.stderr) {
    console.error('stderr:', error.stderr.toString());
  }
  process.exit(1);
}
