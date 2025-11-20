
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

const path = require('path');

module.exports = {
  ...nextConfig,
  webpack: (config) => {
    config.resolve.alias['@auth'] = path.resolve(__dirname, '../../packages/auth');
    return config;
  },
};
