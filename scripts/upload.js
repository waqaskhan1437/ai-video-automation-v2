const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const CATBOX_API = 'https://catbox.moe/user/api.php';
const LITTERBOX_API = 'https://litterbox.catbox.moe/resources/internals/api.php';

const USE_LITTERBOX = process.argv[2] === 'litterbox';

async function uploadToCatbox(filename) {
  const apiUrl = USE_LITTERBOX ? LITTERBOX_API : CATBOX_API;
  const fileStream = fs.createReadStream(filename);
  const stats = fs.statSync(filename);
  
  const formData = new FormData();
  formData.append('reqtype', 'fileUpload');
  
  if (USE_LITTERBOX) {
    formData.append('time', '72h');
  }
  
  formData.append('fileToUpload', fileStream, {
    filename: filename,
    contentType: 'video/mp4',
    knownLength: stats.size
  });
  
  console.log(`Uploading to ${USE_LITTERBOX ? 'Litterbox' : 'Catbox'}...`);
  console.log(`File: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000
    });
    
    const url = response.data.trim();
    
    if (url.startsWith('https://')) {
      console.log(`Upload successful: ${url}`);
      return url;
    } else {
      console.error(`Upload failed: ${response.data}`);
      throw new Error(`Invalid response: ${response.data}`);
    }
  } catch (error) {
    console.error(`Upload error: ${error.message}`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${error.response.data}`);
    }
    
    throw error;
  }
}

const filename = process.argv[3] || 'merged_video.mp4';

if (!fs.existsSync(filename)) {
  console.error(`File not found: ${filename}`);
  process.exit(1);
}

uploadToCatbox(filename)
  .then(url => {
    console.log('\n=== RESULT ===');
    console.log(`URL=${url}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n=== ERROR ===');
    console.error(error.message);
    process.exit(1);
  });
