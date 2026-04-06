const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MAGIC_HOUR_API_URL = 'https://api.magichour.ai/v1/text-to-video';
const CLIP_DURATION = 5;
const NUM_CLIPS = parseInt(process.argv[3]) || 6;

const API_KEY = process.env.MAGIC_HOUR_API_KEY || '';

const prompts = [
  "A serene mountain landscape at sunrise with golden light",
  "Ocean waves crashing on a rocky coastline at sunset",
  "A bustling city street with people walking and cars passing",
  "Forest pathway covered in autumn leaves with sunlight filtering through",
  "A cozy coffee shop interior with steam rising from cups",
  "Stars twinkling in a clear night sky with Milky Way visible",
  "Rain falling on a window with city lights in the background",
  "A garden full of colorful flowers blooming in spring",
  "Snow falling gently over a peaceful village",
  "A rocket launching into space with smoke trail",
  "Northern lights dancing across the Arctic sky",
  "A waterfall cascading down mossy rocks in tropical forest",
  "Hot air balloons floating over a scenic valley at dawn",
  "A butterfly landing on a flower in a sunny meadow",
  "Lightning storm over a dark prairie landscape"
];

const randomPrompts = [
  "Time-lapse of a blooming flower from bud to full bloom",
  "Aerial view of a tropical island from above",
  "Underwater scene with colorful coral reef and fish",
  "A train traveling through snowy mountains",
  "Cherry blossom petals falling in slow motion",
  "A campfire night scene with stars in the sky",
  "City skyline at night with traffic light trails",
  "A waterfall in the rainforest with sunbeams",
  "Desert dunes with wind blowing sand",
  "A cat playing with yarn in a cozy room"
];

function getRandomPrompts(count) {
  const shuffled = [...randomPrompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getClipPrompts(originalPrompt, count) {
  if (originalPrompt && originalPrompt.trim() !== '') {
    return Array(count).fill(originalPrompt);
  }
  return getRandomPrompts(count);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkVideoStatus(videoId) {
  const response = await axios.get(
    `https://api.magichour.ai/v1/text-to-video/${videoId}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

async function generateClipWithMagicHour(prompt, index) {
  console.log(`Generating clip ${index + 1}: ${prompt.substring(0, 50)}...`);
  
  try {
    const response = await axios.post(MAGIC_HOUR_API_URL, {
      name: `AI_Video_Clip_${index + 1}`,
      end_seconds: CLIP_DURATION,
      aspect_ratio: "16:9",
      resolution: "480p",
      model: "ltx-2",
      audio: true,
      style: {
        prompt: prompt
      }
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const videoId = response.data.id;
    console.log(`  Video job created: ${videoId}`);
    
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await sleep(5000);
      
      const status = await checkVideoStatus(videoId);
      console.log(`  Status: ${status.status}, Progress: ${status.progress || 0}%`);
      
      if (status.status === 'completed') {
        if (status.downloads && status.downloads.length > 0) {
          const videoUrl = status.downloads[0];
          console.log(`  Download URL: ${videoUrl}`);
          
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 120000
          });
          
          const filename = `clip_${String(index + 1).padStart(2, '0')}.mp4`;
          const filepath = path.join('clips', filename);
          
          if (!fs.existsSync('clips')) {
            fs.mkdirSync('clips', { recursive: true });
          }
          
          fs.writeFileSync(filepath, Buffer.from(videoResponse.data));
          
          console.log(`✓ Clip ${index + 1} saved: ${filename} (${(videoResponse.data.length / 1024 / 1024).toFixed(2)} MB)`);
          
          return {
            index: index + 1,
            prompt: prompt,
            filename: filename,
            url: videoUrl,
            size: videoResponse.data.length
          };
        }
      } else if (status.status === 'failed') {
        throw new Error(`Video generation failed: ${status.error || 'Unknown error'}`);
      }
      
      attempts++;
    }
    
    throw new Error('Video generation timed out');
    
  } catch (error) {
    console.error(`✗ Failed to generate clip ${index + 1}:`, error.message);
    throw error;
  }
}

async function generateClips() {
  const originalPrompt = process.argv[2] || '';
  const clipPrompts = getClipPrompts(originalPrompt, NUM_CLIPS);
  
  console.log('\n🎬 AI Video Generation Pipeline');
  console.log('='.repeat(50));
  console.log(`API: Magic Hour (${API_KEY ? 'API Key Set' : 'NO API KEY - Demo Mode'})`);
  console.log(`Prompt: ${originalPrompt || '(Random)'}`);
  console.log(`Clips: ${NUM_CLIPS} × ${CLIP_DURATION}s = ${NUM_CLIPS * CLIP_DURATION}s total`);
  console.log('='.repeat(50) + '\n');
  
  if (!API_KEY) {
    console.log('⚠️  WARNING: No Magic Hour API key found!');
    console.log('⚠️  Set MAGIC_HOUR_API_KEY in GitHub Secrets');
    console.log('⚠️  Demo mode: Creating placeholder files\n');
    
    if (!fs.existsSync('clips')) {
      fs.mkdirSync('clips', { recursive: true });
    }
    
    const clips = [];
    for (let i = 0; i < NUM_CLIPS; i++) {
      const filename = `clip_${String(i + 1).padStart(2, '0')}.mp4`;
      const demoContent = createDemoVideoPlaceholder(clipPrompts[i], i + 1);
      fs.writeFileSync(path.join('clips', filename), demoContent);
      
      clips.push({
        index: i + 1,
        prompt: clipPrompts[i],
        filename: filename,
        size: demoContent.length,
        demo: true
      });
      
      console.log(`✓ Demo clip ${i + 1}: ${filename}`);
    }
    
    fs.writeFileSync('clips.json', JSON.stringify(clips, null, 2));
    
    const totalSize = clips.reduce((sum, c) => sum + c.size, 0);
    console.log('\n' + '='.repeat(50));
    console.log(`✓ ${NUM_CLIPS} demo clips created!`);
    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('='.repeat(50));
    console.log('\n📋 SETUP REQUIRED:');
    console.log('1. Get Magic Hour API key: https://magichour.ai/settings/developer');
    console.log('2. Add MAGIC_HOUR_API_KEY to GitHub Secrets');
    console.log('3. Re-run workflow to generate real AI videos\n');
    
    return clips;
  }
  
  const clips = [];
  
  for (let i = 0; i < NUM_CLIPS; i++) {
    const clip = await generateClipWithMagicHour(clipPrompts[i], i);
    clips.push(clip);
    
    if (i < NUM_CLIPS - 1) {
      console.log('Waiting 10 seconds before next clip...');
      await sleep(10000);
    }
  }
  
  fs.writeFileSync('clips.json', JSON.stringify(clips, null, 2));
  
  const totalSize = clips.reduce((sum, c) => sum + c.size, 0);
  console.log('\n' + '='.repeat(50));
  console.log(`✓ All ${NUM_CLIPS} clips generated!`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(50));
  
  return clips;
}

function createDemoVideoPlaceholder(prompt, index) {
  const info = {
    index: index,
    prompt: prompt,
    type: 'demo',
    message: 'Add MAGIC_HOUR_API_KEY to generate real videos'
  };
  return Buffer.from(JSON.stringify(info));
}

generateClips().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
