const ImageKit = require('imagekit');

let imagekit = null;

if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
} else {
  // Safe fallback dummy for development without ImageKit credentials
  imagekit = {
    upload: async ({ file, fileName }) => {
      console.warn('ImageKit credentials missing. Simulating image upload.');
      return {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        fileId: 'mock_img_' + Date.now(),
      };
    }
  };
}

module.exports = imagekit;
