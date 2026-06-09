const axios = require('axios');

const getImageTags = async (imageUrl) => {
  try {
    console.log('=== IMAGGA AI CALLED ===');
    console.log('Image URL:', imageUrl);
    console.log('API Key exists:', !!process.env.IMAGGA_API_KEY);
    console.log('API Key value:', process.env.IMAGGA_API_KEY);

    const response = await axios.get(
      'https://api.imagga.com/v2/tags',
      {
        params: { image_url: imageUrl },
        auth: {
          username: process.env.IMAGGA_API_KEY,
          password: process.env.IMAGGA_API_SECRET
        }
      }
    );

    console.log('=== IMAGGA RESPONSE ===');
    console.log('Status:', response.status);

    const tags = response.data.result.tags
      .filter(t => t.confidence > 30)
      .slice(0, 10)
      .map(t => t.tag.en.toLowerCase());

    console.log('=== TAGS GENERATED ===', tags);
    return tags;

  } catch (error) {
    console.error('=== IMAGGA ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data));
    console.error('Message:', error.message);
    return [];
  }
};

module.exports = { getImageTags };