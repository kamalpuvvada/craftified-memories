import React, { useState } from 'react';
import './PhotoUpload.css';

const PhotoUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'puzzles'
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    if (!productData.name) {
      alert('Please enter a product name');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const queryParams = new URLSearchParams({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category
      });

      const response = await fetch(`/api/upload-photo?${queryParams}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert('Photo uploaded successfully!');
        
        // Reset form
        setSelectedFile(null);
        setPreview(null);
        setProductData({
          name: '',
          description: '',
          price: '',
          category: 'puzzles'
        });
        
        // Clear file input
        document.getElementById('photo-input').value = '';
        
        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess(result.product);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload">
      <h2>Upload New Product</h2>
      
      <form onSubmit={handleUpload} className="upload-form">
        <div className="form-row">
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={productData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={productData.category}
              onChange={handleInputChange}
            >
              <option value="puzzles">Puzzles</option>
              <option value="magnets">Magnets</option>
              <option value="crafts">Craft Kits</option>
              <option value="memory-boxes">Memory Boxes</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={productData.description}
            onChange={handleInputChange}
            placeholder="Enter product description"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Price (₹)</label>
          <input
            type="number"
            name="price"
            value={productData.price}
            onChange={handleInputChange}
            placeholder="Enter price"
          />
        </div>

        <div className="form-group">
          <label>Product Photo *</label>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </div>

        {preview && (
          <div className="preview">
            <h3>Preview:</h3>
            <img src={preview} alt="Preview" className="preview-image" />
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className="upload-btn"
        >
          {uploading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
    </div>
  );
};

export default PhotoUpload;
