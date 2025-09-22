import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './logo.jpeg';

// Add Product Upload Component
const AddProduct = ({ onProductAdded, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categories: [],
    price: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Replace with your actual Azure Function URL
  const AZURE_FUNCTION_URL = 'https://craftified-photos-upload-d9gjembzfjgkhed8.southindia-01.azurewebsites.net/api/upload-photo';

  const availableCategories = [
    'Cake Toppers', 'Banners', 'Shadow Boxes', 'Photo Frames', 
    'Magnets', 'Puzzles', 'Return Gifts'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !selectedFile || formData.categories.length === 0) {
      alert('Please fill all required fields and select an image');
      return;
    }

    setUploading(true);
    
    try {
      // Upload to Azure
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      
      const response = await fetch(AZURE_FUNCTION_URL, {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();

      if (result.success) {
        // Create new product object
        const newProduct = {
          id: result.file.id,
          name: formData.name,
          description: formData.description,
          categories: formData.categories,
          price: formData.price,
          images: [result.file.url], // Azure blob URL
          uploadedAt: new Date().toISOString()
        };

        // Add to products list
        onProductAdded(newProduct);
        
        // Reset form
        setFormData({ name: '', description: '', categories: [], price: '' });
        setSelectedFile(null);
        
        alert('Product added successfully!');
        onClose();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading product:', error);
      alert('Error uploading product: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="add-product-modal">
      <div className="add-product-content">
        <div className="add-product-header">
          <h2>Add New Product</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Product Name */}
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Product Description */}
          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product"
              rows="3"
              required
            />
          </div>

          {/* Categories */}
          <div className="form-group">
            <label>Categories * (Select at least one)</label>
            <div className="category-grid">
              {availableCategories.map(category => (
                <label key={category} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="form-group">
            <label>Price (Optional)</label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="e.g., ₹500 or Contact for quote"
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>Product Image *</label>
            <div 
              className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                id="file-input"
                hidden
              />
              
              {selectedFile ? (
                <div className="file-preview">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="preview-image"
                  />
                  <p>{selectedFile.name}</p>
                  <button type="button" onClick={() => setSelectedFile(null)}>
                    Remove
                  </button>
                </div>
              ) : (
                <label htmlFor="file-input" className="upload-label">
                  <div className="upload-content">
                    <span className="upload-icon">📸</span>
                    <p>Drag & drop your image here</p>
                    <p>or <span className="browse-link">browse files</span></p>
                    <small>Supports: JPG, PNG, GIF (Max: 5MB)</small>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Image Carousel Component (supports both small and large views)
const ImageCarousel = ({ images, productName, isLarge = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = (e) => {
    if (e) {
      e.stopPropagation(); // Prevent modal from opening
    }
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    if (e) {
      e.stopPropagation(); // Prevent modal from opening
    }
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDotClick = (index, e) => {
    if (e) {
      e.stopPropagation(); // Prevent modal from opening
    }
    setCurrentIndex(index);
  };

  const handleTouchStart = (e) => {
    const touchStartX = e.touches[0].clientX;
    e.target.setAttribute('data-touch-start', touchStartX);
  };

  const handleTouchEnd = (e) => {
    const touchStartX = parseFloat(e.target.getAttribute('data-touch-start'));
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={`carousel-container ${isLarge ? 'large' : 'small'}`}>
        <div className="carousel-placeholder">
          <span>No images</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`carousel-container ${isLarge ? 'large' : 'small'}`}>
      <div className="carousel-wrapper">
        <div 
          className="carousel-image"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img 
            src={images[currentIndex]} 
            alt={`${productName} - ${currentIndex + 1}`}
            loading="lazy"
          />
        </div>

        {images.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <button 
              className="carousel-btn prev" 
              onClick={prevImage}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button 
              className="carousel-btn next" 
              onClick={nextImage}
              aria-label="Next image"
            >
              ›
            </button>

            {/* Dots Indicator */}
            <div className="carousel-dots">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={(e) => handleDotClick(index, e)}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  // Product data - You can expand this array
  const [allProducts, setAllProducts] = useState([
    // Sample products - these will be replaced with products from Azure
    {
      id: 1,
      name: "Custom Name Cake Topper",
      description: "Beautiful personalized cake topper made with premium cardstock. Perfect for birthdays and celebrations.",
      categories: ["Cake Toppers"],
      images: [
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
        "https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=400"
      ]
    },
    // Add more sample products as needed...
  ]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Available categories
  const categories = [
    'Cake Toppers', 'Banners', 'Shadow Boxes', 
    'Photo Frames', 'Magnets', 'Puzzles', 'Return Gifts'
  ];

  // Filter products based on selected categories
  const filteredProducts = selectedCategories.length === 0 
    ? allProducts 
    : allProducts.filter(product => 
        product.categories.some(category => selectedCategories.includes(category))
      );

  // Handle category selection
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
  };

  // Add Product Handler
  const handleProductAdded = (newProduct) => {
    setAllProducts(prev => [newProduct, ...prev]); // Add to beginning of array
    console.log('New product added:', newProduct);
  };

  // Close modal
  const closeModal = () => {
    setSelectedProduct(null);
  };

  // Close modal when clicking outside
  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (selectedProduct) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [selectedProduct]);

  return (
    <div className="App">
      {/* Header */}
      <header className="App-header">
        <div className="header-content">
          <img src={logo} alt="Craftified Memories Logo" className="logo" />
          <div className="header-text">
            <h1>Craftified Memories</h1>
            <p className="tagline">Turning moments into memories, crafted with love ✨</p>
          </div>
        </div>
      </header>

      {/* Admin Section - Add Product Button */}
      <div className="admin-section">
        <button 
          className="add-product-btn"
          onClick={() => setShowAddProduct(true)}
        >
          + Add New Product
        </button>
      </div>

      {/* About Section */}
      <section className="about-section">
        <div className="about-content">
          <h2>About Craftified Memories</h2>
          <div className="about-text">
            <p>
              At <strong>Craftified Memories</strong>, we turn your special moments into treasures you can see, touch, and cherish forever.
            </p>
            <p>
              From personalized cake toppers and banners that make every celebration brighter, to custom shadow boxes, photo frames, fridge magnets, and puzzles that capture memories in unique ways — each piece is carefully designed and crafted with love.
            </p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">🎨</span>
                <span>– every design is made just for you</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⭐</span>
                <span>– using premium papers, durable materials, and fine detailing</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🎉</span>
                <span>– perfect for birthdays, weddings, anniversaries, newborn milestones, festive occasions, or as thoughtful return gifts</span>
              </div>
            </div>
            <p className="mission">
              <strong>Our mission is simple:</strong> to craft your memories into lasting keepsakes — gifts and décor that not only look beautiful but also hold a special meaning for you and your loved ones.
            </p>
            <p className="tagline-bottom">
              <em>Because every memory deserves to be <strong>Craftified</strong> ✨</em>
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="filter-section">
        <h2>Browse Our Creations</h2>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${selectedCategories.includes(category) ? 'active' : ''}`}
              onClick={() => handleCategoryToggle(category)}
            >
              {category}
            </button>
          ))}
          
          {selectedCategories.length > 0 && (
            <button className="clear-filter-btn" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>

        <div className="filter-info">
          {selectedCategories.length > 0 && (
            <p>
              Showing products in: <strong>{selectedCategories.join(', ')}</strong>
            </p>
          )}
          <p className="product-count">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </section>

      {/* Product Gallery */}
      <section className="products-section">
        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => setSelectedProduct(product)}
              >
                <ImageCarousel 
                  images={product.images} 
                  productName={product.name}
                />
                
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-categories">
                    {product.categories.join(' • ')}
                  </p>
                  {product.price && (
                    <p className="product-price">{product.price}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <h3>No products found.</h3>
            <p>
              {selectedCategories.length > 0 
                ? 'Try selecting different categories.' 
                : 'Add your first product to get started!'}
            </p>
          </div>
        )}
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={handleModalClick}>
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>✕</button>
            
            <div className="modal-body">
              <div className="modal-image">
                <ImageCarousel 
                  images={selectedProduct.images} 
                  productName={selectedProduct.name}
                  isLarge={true}
                />
              </div>
              
              <div className="modal-info">
                <h2>{selectedProduct.name}</h2>
                <p className="modal-categories">
                  {selectedProduct.categories.join(' • ')}
                </p>
                
                <div className="modal-description">
                  <p>{selectedProduct.description}</p>
                </div>
                
                {selectedProduct.price && (
                  <p className="modal-price">{selectedProduct.price}</p>
                )}
                
                <div className="modal-footer">
                  <p className="shipping-note">📦 Shipping charges extra</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProduct
          onProductAdded={handleProductAdded}
          onClose={() => setShowAddProduct(false)}
        />
      )}

      {/* Footer */}
      <footer className="App-footer">
        <div className="footer-content">
          <p>&copy; 2024 Craftified Memories. Made with ❤️ for your special moments.</p>
          <p>Contact us to bring your ideas to life!</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
