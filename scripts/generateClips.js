const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLIP_DURATION = 10;
const NUM_CLIPS = parseInt(process.argv[3]) || 6;
const FRAME_RATE = 30;
const RESOLUTION = '1280x720';

const API_KEY = process.env.MAGIC_HOUR_API_KEY || '';
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || '';

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getColorForPrompt(prompt) {
  const colors = [
    ['#FF6B6B', '#4ECDC4'], // Red to Teal
    ['#667EEA', '#764BA2'], // Purple gradient
    ['#F093FB', '#F5576C'], // Pink to Red
    ['#4FACFE', '#00F2FE'], // Blue gradient
    ['#43E97B', '#38F9D7'], // Green gradient
    ['#FA709A', '#FEE140'], // Pink to Yellow
    ['#A18CD1', '#FBC2EB'], // Purple to Pink
    ['#FF9A9E', '#FECFEF'], // Coral gradient
    ['#A1C4FD', '#C2E9FB'], // Sky blue
    ['#D4FC79', '#96E6A1']  // Lime green
  ];
  
  const index = Math.abs(hashCode(prompt)) % colors.length;
  return colors[index];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function generateGradientImage(prompt, filename, width = 1280, height = 720) {
  const colors = getColorForPrompt(prompt);
  const color1 = colors[0];
  const color2 = colors[1];
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend in="SourceGraphic" in2="noise" mode="soft-light"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="0.1"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" filter="url(#glow)">${escapeXml(prompt)}</text>
  <circle cx="${width * 0.3}" cy="${height * 0.3}" r="100" fill="rgba(255,255,255,0.1)"/>
  <circle cx="${width * 0.7}" cy="${height * 0.6}" r="150" fill="rgba(255,255,255,0.08)"/>
  <circle cx="${width * 0.5}" cy="${height * 0.8}" r="80" fill="rgba(255,255,255,0.05)"/>
</svg>`;
  
  fs.writeFileSync(filename, svg);
  return filename;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&apos;');
}

function createKenBurnsVideo(inputImage, outputVideo, duration, effectType = 'zoom_in') {
  const width = 1280;
  const height = 720;
  const startZoom = 1.0;
  const endZoom = effectType === 'zoom_in' ? 1.3 : 0.8;
  
  const scaleX = effectType === 'pan_left' ? 1.2 : 1.0;
  const scaleY = effectType === 'pan_up' ? 1.2 : 1.0;
  
  const zoomFilter = `scale=${width}*${startZoom}:${height}*${startZoom}*${scaleX},setsar=1,setpts=PTS/${endZoom/startZoom}-PTS_START`;

  const vf = `zoompan=z='min(zoom+0.001,${endZoom})':d=${duration * FRAME_RATE}:s=${width}x${height}:fps=${FRAME_RATE}`;
  
  try {
    execSync(`ffmpeg -y -loop 1 -i "${inputImage}" -vf "${vf}" -t ${duration} -pix_fmt yuv420p "${outputVideo}"`, { stdio: 'pipe' });
    return outputVideo;
  } catch (error) {
    console.log('  FFmpeg zoompan failed, trying alternative method...');
    
    const filter = `scale=${width}:${height},zoompan=z='1+0.005*min(t/${duration},1)*(${endZoom/startZoom - 1})':d=${duration * FRAME_RATE}:s=${width}x${height}:fps=${FRAME_RATE}`;
    
    execSync(`ffmpeg -y -loop 1 -i "${inputImage}" -vf "${filter}" -t ${duration} -pix_fmt yuv420p "${outputVideo}"`, { stdio: 'pipe' });
    return outputVideo;
  }
}

async function generateClipWithKenBurns(prompt, index) {
  console.log(`Generating clip ${index + 1}: ${prompt.substring(0, 50)}...`);
  
  const clipDir = path.join('clips');
  if (!fs.existsSync(clipDir)) {
    fs.mkdirSync(clipDir, { recursive: true });
  }
  
  const imageFile = path.join(clipDir, `image_${String(index + 1).padStart(2, '0')}.svg`);
  const videoFile = path.join(clipDir, `clip_${String(index + 1).padStart(2, '0')}.mp4`);
  
  generateGradientImage(prompt, imageFile, 1280, 720);
  
  const effectTypes = ['zoom_in', 'zoom_out', 'pan_left', 'pan_up'];
  const effect = effectTypes[index % effectTypes.length];
  
  createKenBurnsVideo(imageFile, videoFile, CLIP_DURATION, effect);
  
  const stats = fs.statSync(videoFile);
  
  console.log(`  Clip ${index + 1} created: clip_${String(index + 1).padStart(2, '0')}.mp4 (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  return {
    index: index + 1,
    prompt: prompt,
    filename: path.basename(videoFile),
    size: stats.size,
    effect: effect,
    type: 'ken-burns-animation'
  };
}

async function generateClips() {
  const originalPrompt = process.argv[2] || '';
  const clipPrompts = getClipPrompts(originalPrompt, NUM_CLIPS);
  
  console.log('\n🎬 AI Video Generation Pipeline (Open Source Free)');
  console.log('='.repeat(50));
  console.log(`Method: Ken Burns Effect Animation`);
  console.log(`Prompt: ${originalPrompt || '(Random)'}`);
  console.log(`Clips: ${NUM_CLIPS} × ${CLIP_DURATION}s = ${NUM_CLIPS * CLIP_DURATION}s total`);
  console.log('='.repeat(50) + '\n');
  
  if (!fs.existsSync('clips')) {
    fs.mkdirSync('clips', { recursive: true });
  }
  
  const clips = [];
  
  for (let i = 0; i < NUM_CLIPS; i++) {
    const clip = await generateClipWithKenBurns(clipPrompts[i], i);
    clips.push(clip);
  }
  
  fs.writeFileSync('clips.json', JSON.stringify(clips, null, 2));
  
  const totalSize = clips.reduce((sum, c) => sum + c.size, 0);
  console.log('\n' + '='.repeat(50));
  console.log(`✓ All ${NUM_CLIPS} clips generated!`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(50));
  
  return clips;
}

generateClips().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
