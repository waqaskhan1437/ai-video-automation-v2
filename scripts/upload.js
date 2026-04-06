const fs = require('fs');
const { execSync } = require('child_process');

const CATBOX_API = 'https://catbox.moe/user/api.php';
const LITTERBOX_API = 'https://litterbox.catbox.moe/resources/internals/api.php';

const USE_LITTERBOX = process.argv[2] === 'litterbox';
const filename = process.argv[3] || 'merged_video.mp4';

if (!fs.existsSync(filename)) {
  console.error(`File not found: ${filename}`);
  process.exit(1);
}

const stats = fs.statSync(filename);
console.log(`Uploading ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

const apiUrl = USE_LITTERBOX ? LITTERBOX_API : CATBOX_API;
console.log(`Uploading to: ${USE_LITTERBOX ? 'Litterbox' : 'Catbox'}`);

try {
  const absolutePath = fs.realpathSync(filename);
  console.log(`Real path: ${absolutePath}`);
  
  const cmd = [
    'curl', '-s', '-S', '-w', '\\n%{http_code}',
    '-F', `reqtype=fileUpload`,
    ...(USE_LITTERBOX ? ['-F', 'time=72h'] : []),
    '-F', `fileToUpload=@${absolutePath}`,
    apiUrl
  ];
  
  console.log('Executing curl upload...');
  
  const response = execSync(cmd.join(' '), { 
    maxBuffer: 50 * 1024 * 1024,
    timeout: 120000,
    encoding: 'utf8'
  });
  
  const lines = response.trim().split('\n');
  const httpCode = lines.pop();
  const url = lines.join('\n').trim();
  
  console.log(`HTTP Code: ${httpCode}`);
  console.log(`Response: ${url}`);
  
  if (httpCode === '200' && url.startsWith('https://')) {
    console.log('\n=== SUCCESS ===');
    console.log('URL=' + url);
    process.exit(0);
  } else {
    console.error('\n=== ERROR ===');
    console.error('Invalid response:', url);
    console.error('HTTP Code:', httpCode);
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n=== EXCEPTION ===');
  console.error(error.message);
  if (error.stderr) {
    console.error('stderr:', error.stderr.toString());
  }
  process.exit(1);
}
