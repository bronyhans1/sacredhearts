import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { X, Check } from 'lucide-react';

const ImageCropModal = ({ imageSrc, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to match cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        // Create a File object from the blob
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      onClose();
      return;
    }

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      onClose();
    }
  };

  const handleSkip = async () => {
    // If user skips, use original image - convert blob URL to File
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'original-image.jpg', { type: blob.type || 'image/jpeg' });
      onCropComplete(file);
      onClose();
    } catch (error) {
      console.error('Error loading original image:', error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-bold text-lg">Crop Image</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg text-sm"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              <Check size={16} />
              Save
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Cropper */}
        <div className="flex-1 relative bg-gray-800" style={{ minHeight: '400px', width: '100%' }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // Square crop for avatars
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
              cropShape="rect"
              showGrid={false}
            />
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-700">
          <div className="space-y-3">
            <div>
              <label className="text-white text-sm mb-2 block">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <p className="text-gray-400 text-xs">
              Adjust the image position and zoom, then click Save. You can skip cropping if you prefer the original image.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
