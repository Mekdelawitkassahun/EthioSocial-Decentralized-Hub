import axios from 'axios';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_GATEWAY = 'https://gateway.pinata.cloud';

export const uploadToIPFS = async (file: File): Promise<string> => {
  console.log('IPFS Upload starting for:', file.name);
  console.log('JWT status:', PINATA_JWT ? `Exists (length: ${PINATA_JWT.length})` : 'Missing');

  if (!PINATA_JWT || PINATA_JWT.length < 50) {
    const error = 'Invalid Pinata JWT in .env.local. Please provide a valid long-form JWT from Pinata Dashboard.';
    console.error(error);
    throw new Error(error);
  }

  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata for Pinata
  const metadata = JSON.stringify({
    name: file.name || 'ethio-social-upload',
  });
  formData.append('pinataMetadata', metadata);

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.IpfsHash;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Failed to upload to IPFS');
    }
    throw error;
  }
};

export const uploadAvatar = async (file: File): Promise<string> => {
  // Compress image before upload
  const compressedFile = await compressImage(file, 500, 500);
  return uploadToIPFS(compressedFile);
};

export const uploadPostImage = async (file: File): Promise<string> => {
  // Compress image for posts
  const compressedFile = await compressImage(file, 1200, 1200);
  return uploadToIPFS(compressedFile);
};

export const uploadCoverImage = async (file: File): Promise<string> => {
  // Compress cover image
  const compressedFile = await compressImage(file, 1500, 500);
  return uploadToIPFS(compressedFile);
};

// Helper function to compress images
const compressImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
  console.log(`Compressing image: ${file.name}, size: ${file.size}, type: ${file.type}`);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        console.log(`Original dimensions: ${width}x${height}`);
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        console.log(`Compressed dimensions: ${width}x${height}`);
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not found'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            console.log(`Final compressed size: ${compressedFile.size}`);
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed - toBlob returned null'));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => {
        console.error('Image load failed');
        reject(new Error('Image load failed'));
      };
    };
    reader.onerror = () => {
      console.error('FileReader failed');
      reject(new Error('FileReader failed'));
    };
  });
};

export const getIPFSUrl = (hash: string): string => {
  return `${PINATA_GATEWAY}/ipfs/${hash}`;
};
