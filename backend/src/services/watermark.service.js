const sharp = require('sharp');
const axios = require('axios');

const addWatermark = async (imageUrl, watermarkText) => {
  try {
    // Download image from S3
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Create watermark text as SVG
    const fontSize = Math.max(16, Math.floor(width / 30));
    const padding = 20;

    const svgWatermark = `
      <svg width="${width}" height="${height}">
        <defs>
          <style>
            .watermark {
              fill: rgba(255, 255, 255, 0.85);
              font-size: ${fontSize}px;
              font-family: Arial, sans-serif;
              font-weight: bold;
            }
            .watermark-bg {
              fill: rgba(0, 0, 0, 0.45);
            }
          </style>
        </defs>
        <rect
          x="0"
          y="${height - fontSize * 2 - padding}"
          width="${width}"
          height="${fontSize * 2 + padding}"
          class="watermark-bg"
        />
        <text
          x="${padding}"
          y="${height - fontSize - padding / 2}"
          class="watermark"
        >${watermarkText}</text>
      </svg>
    `;

    // Composite watermark onto image
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(svgWatermark),
          top: 0,
          left: 0
        }
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('Watermark error:', error.message);
    throw error;
  }
};

module.exports = { addWatermark };