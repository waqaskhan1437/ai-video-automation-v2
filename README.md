# AI Video Automation

Generate AI videos using **FREE Open Source tools** - Ken Burns animation effect with FFmpeg. No API keys needed, no GPU required, 100% free!

## Features

- **100% FREE** - No API keys, no paid services
- **Open Source** - Uses FFmpeg for video creation
- **Ken Burns Effect** - Professional zoom/pan animations
- **No GPU Required** - Runs on any machine
- **GitHub Actions** - Fully automated pipeline
- **Catbox Upload** - Free video hosting

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS (Backend)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │ Generate    │→ │ Ken Burns   │→ │ Merge with FFmpeg       │  │
│  │ SVG Images │  │ Animation   │  │ Concatenate clips       │  │
│  └─────────────┘  └─────────────┘  └────────────────────────┘  │
│                                                          ↓      │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │ Upload to  │  │ GitHub Issue (Video URL)             │  │
│  │ Catbox     │  │ Auto-created with download link      │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technologies Used

| Tool | Purpose | License |
|------|---------|---------|
| **FFmpeg** | Video creation & merging | LGPL/GPL |
| **Node.js** | Script orchestration | MIT |
| **SVG** | Image generation | Open |
| **Catbox** | Free video hosting | Free |

## Quick Start

### 1. Fork This Repository

Click **"Use this template"** on GitHub to create your own copy.

### 2. Enable GitHub Actions

Go to your repository's **Actions** tab and enable workflows.

### 3. Generate Your First Video

1. Go to **Actions** tab
2. Click **"Manual Video Generation"** workflow
3. Click **"Run workflow"**
4. Enter a prompt (or leave empty for random)
5. Click **"Run workflow"**

### 4. Wait for the Video

The workflow will:
1. Generate gradient images with your prompt text
2. Apply Ken Burns animation effect (zoom/pan)
3. Merge 6 clips into 1 video (~60 seconds)
4. Upload to Catbox (free hosting)
5. Create a GitHub Issue with the video URL

## Video Generation Method

### Ken Burns Effect Animation

The system creates professional-looking videos using:

1. **SVG Images** - Gradient backgrounds with prompt text
2. **Zoom/Pan Animation** - Ken Burns effect using FFmpeg
3. **Effects** - 
   - Zoom In
   - Zoom Out
   - Pan Left
   - Pan Up

### Example Output

Each video consists of:
- **6 clips** × **10 seconds** = **60 seconds total**
- Resolution: 1280×720 (720p)
- Frame rate: 30fps
- Effect: Smooth Ken Burns zoom/pan

## Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **Manual Video** | Button click | Generate video on-demand |
| **Scheduled Video** | Daily at 9 AM | Auto-generate daily video |

## Project Structure

```
ai-video-automation/
├── .github/
│   └── workflows/
│       ├── manual-video.yml      # On-demand generation
│       └── scheduled-video.yml  # Daily auto-generation
├── scripts/
│   └── generateClips.js        # Video generation logic
├── frontend/
│   ├── index.html               # Dashboard UI
│   └── styles.css
├── package.json
└── README.md
```

## Generate Videos Locally

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/ai-video-automation.git
cd ai-video-automation

# Install dependencies
npm install

# Install FFmpeg (Ubuntu/Debian)
sudo apt-get install ffmpeg

# Generate video with custom prompt
node scripts/generateClips.js "A sunset over the ocean" 6

# Generate random video
node scripts/generateClips.js

# The video will be in clips/ folder
ls -la clips/

# Merge clips manually
ffmpeg -f concat -safe 0 -i <(for f in clips/*.mp4; do echo "file '$f'"; done) -c copy merged.mp4
```

## Customization

### Change Number of Clips

Edit `generateClips.js`:
```javascript
const NUM_CLIPS = 6; // Change this
const CLIP_DURATION = 10; // Change clip length (seconds)
```

### Change Animation Effects

The script automatically cycles through these effects:
- `zoom_in` - Camera zooms into the image
- `zoom_out` - Camera zooms out from the image
- `pan_left` - Camera pans to the left
- `pan_up` - Camera pans upward

### Add Custom Image Sources

Modify `generateGradientImage()` to:
- Use external image APIs
- Download images from URLs
- Use local image files

## No API Keys Required

This is completely free because it doesn't use:
- ❌ No paid AI APIs
- ❌ No GPU services
- ❌ No subscription services

It only uses:
- ✅ FFmpeg (free, open source)
- ✅ Catbox (free file hosting)
- ✅ GitHub Actions (free tier: 2000 min/month)

## Limitations

- Animation effect (Ken Burns) instead of AI video generation
- SVG-based images with text overlay
- No realistic scenes or characters
- Resolution limited to 720p

## For Realistic AI Videos

If you need realistic AI-generated videos, consider:
- **Magic Hour API** (400 free credits)
- **Luma AI** (100 free credits/month)
- **Runway ML** ($10 minimum)

## License

MIT
