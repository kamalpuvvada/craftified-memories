import { Buffer } from "buffer";
window.Buffer = Buffer;

import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './logo.jpeg';
// Import Azure services
import { uploadImageToAzure } from './services/azureStorage';
import { saveProductToAzure, getAllProductsFromAzure, deleteProductFromAzure } from './services/azureDatabase';


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
      <div className={isLarge ? "product-placeholder-large" : "product-placeholder"}>
        <div className="placeholder-icon">📦</div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={productName}
        className={isLarge ? "product-image-large" : "product-image"}
        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: 'auto' }}
      />
    );
  }

  return (
    <div className={isLarge ? "image-carousel-container-large" : "image-carousel-container"}>
      <img
        src={images[currentIndex]}
        alt={`${productName} ${currentIndex + 1}`}
        className={isLarge ? "product-image-large" : "product-image"}
        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: 'auto' }}
      />

      <button
        className="carousel-nav-btn prev-btn"
        onClick={prevImage}
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        className="carousel-nav-btn next-btn"
        onClick={nextImage}
        aria-label="Next image"
      >
        ›
      </button>

      <div className="mini-dots-indicator">
        {images.map((_, index) => (
          <div
            key={index}
            className={`mini-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={(e) => handleDotClick(index, e)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const isAdmin = true; // Set to true if you want to enable admin UI locally
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    images: [],
    imagePreviews: []
  });

  // Product Detail Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ['Cake Toppers', 'Banners', 'Shadow Boxes', 'Photo Frames', 'Fridge Magnets', 'Puzzles', 'Return Gifts'];

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product =>
        selectedCategories.includes(product.category)
      ));
    }
  }, [products, selectedCategories]);

  useEffect(() => {
    if (showProductModal) {
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          setShowProductModal(false);
          setSelectedProduct(null);
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [showProductModal]);

  // NEW: Load products from Azure Cosmos DB on app startup
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getAllProductsFromAzure();
        setProducts(products);
        console.log('✅ Products loaded from Azure:', products.length);
      } catch (error) {
        console.error('❌ Error loading products from Azure:', error);
        // Fallback to empty array if Azure fails
        setProducts([]);
      }
    };

    loadProducts();
  }, []); // Empty dependency array = runs once when component mounts

  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const url = await uploadImageToAzure(file);
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviews: [...prev.imagePreviews, ...uploadedUrls]
    }));
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
      imagePreviews: prev.imagePreviews.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Update handleSubmit to save to Azure
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const productData = {
        ...formData,
        id: editingProduct ? editingProduct.id : Date.now().toString(),
        price: parseFloat(formData.price)
      };

      await saveProductToAzure(productData);

      // Reload products from Azure
      const products = await getAllProductsFromAzure();
      setProducts(products);

      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '',
      images: [],
      imagePreviews: []
    });
    setShowAddForm(false);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      images: product.images || [],
      imagePreviews: product.imagePreviews || []
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to remove this product?')) {
      setProducts(products.filter(product => product.id !== productId));
    }
  };

  const handleCategoryFilter = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const scrollToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Product Detail Modal Functions
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleWhatsAppInquiry = (product) => {
    const message = `Hi! I'm interested in "${product.name}" (₹${product.price}). Can you please provide more details?`;
    const whatsappUrl = `https://wa.me/9550266837?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo-section" onClick={scrollToHome}>
            <img src={logo} alt="Craftified Memories Logo" className="logo-image" />
            <div className="brand-text">
              <h1 className="brand-name">Craftified Memories</h1>
              <p className="brand-tagline">Handcrafted with Love</p>
            </div>
          </div>
          <div className="header-buttons">
            <a href="https://wa.me/9550266837" target="_blank" rel="noopener noreferrer" className="header-btn whatsapp-btn">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              WhatsApp
            </a>
            <a href="https://www.instagram.com/craftifiedmemories/" target="_blank" rel="noopener noreferrer" className="header-btn instagram-btn">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </a>
            {isAdmin && (
              <button className="header-btn add-btn" onClick={() => setShowAddForm(true)}>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add Product
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <h2 className="hero-title">Welcome to Craftified Memories ✨</h2>
          <p className="hero-subtitle">
            At Craftified Memories, we turn your special moments into treasures you can see, touch, and cherish forever.
          </p>
          <p className="hero-description">
            From personalized cake toppers and banners that make every celebration brighter, to custom shadow boxes, photo frames, fridge magnets, and puzzles that capture memories in unique ways — each piece is carefully designed and crafted with love.
          </p>

          <div className="specialties">
            <h3 className="specialties-title">We specialize in creating products that are:</h3>
            <div className="features-grid">
              <div className="feature-card">
                <h4>Personalized</h4>
                <p>– every design is made just for you</p>
              </div>
              <div className="feature-card">
                <h4>Handcrafted with care</h4>
                <p>– using premium papers, durable materials, and fine detailing</p>
              </div>
              <div className="feature-card">
                <h4>Versatile & creative</h4>
                <p>– perfect for birthdays, weddings, anniversaries, newborn milestones, festive occasions, or as thoughtful return gifts</p>
              </div>
            </div>
          </div>

          <div className="mission-statement">
            <p>Our mission is simple: to craft your memories into lasting keepsakes — gifts and décor that not only look beautiful but also hold a special meaning for you and your loved ones.</p>
            <h3 className="celebration-text">🌸 Celebrate. Decorate. Cherish. 🌸</h3>
            <p className="tagline">Because every memory deserves to be Craftified</p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="filter-section">
        <div className="filter-container">
          <div className="filter-header">
            <div className="filter-title">
              <span className="filter-icon">🔽</span>
              <h3>Filter by Category</h3>
            </div>
            <div className="product-count">
              📦 {filteredProducts.length} products
            </div>
          </div>

          <div className="category-filters">
            <button
              className={`filter-btn ${selectedCategories.length === 0 ? 'active' : ''}`}
              onClick={() => setSelectedCategories([])}
            >
              All Products
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategories.includes(category) ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Add/Edit Product Modal */}
      {showAddForm && isAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                step="0.01"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <textarea
                placeholder="Product Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />

              <div className="file-upload-section">
                <label htmlFor="images" className="file-upload-label">
                  📸 Select Images (Multiple)
                </label>
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImageUpload}
                  className="file-input"
                />
              </div>

              {formData.imagePreviews.length > 0 && (
                <div className="image-thumbnails">
                  <h4>Selected Images ({formData.imagePreviews.length})</h4>
                  <div className="thumbnail-grid">
                    {formData.imagePreviews.map((preview, index) => (
                      <div key={index} className="thumbnail-item">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="thumbnail-image"
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '2px solid #e5e7eb',
                            display: 'block'
                          }}
                        />
                        <button
                          type="button"
                          className="remove-thumb-btn"
                          onClick={() => removeImage(index)}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal product-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProduct.name}</h3>
              <button className="close-btn" onClick={closeProductModal}>×</button>
            </div>
            <div className="product-detail-content">
              <div className="product-detail-images">
                <ImageCarousel
                  images={selectedProduct.imagePreviews || []}
                  productName={selectedProduct.name}
                  isLarge={true}
                />
              </div>
              <div className="product-detail-info">
                <div className="product-category">
                  <span className="category-badge">{selectedProduct.category}</span>
                </div>
                <div className="product-price-large">
                  ₹{selectedProduct.price.toLocaleString()}
                </div>
                <div className="product-description-large">
                  <h4>Description</h4>
                  <p>{selectedProduct.description}</p>
                </div>
                <div className="product-shipping-info">
                  <p>📦 Shipping charges extra</p>
                </div>
                <div className="product-actions">
                  <button
                    className="whatsapp-inquiry-btn"
                    onClick={() => handleWhatsAppInquiry(selectedProduct)}
                  >
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    Inquire on WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <section className="products-section">
        <div className="container">
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <p>No products found. {selectedCategories.length > 0 ? 'Try selecting different categories.' : 'Add your first product to get started!'}</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="card-header">
                    <span className="category-tag">{product.category}</span>
                    <div className="card-actions">
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(product)} className="action-btn edit-btn">
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="action-btn delete-btn">
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="product-image-container clickable-image"
                    onClick={() => openProductModal(product)}
                  >
                    <ImageCarousel
                      images={product.imagePreviews || []}
                      productName={product.name}
                    />
                  </div>
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <p className="product-description">{product.description}</p>
                    <div className="product-price">₹{product.price.toLocaleString()}</div>
                    <div className="shipping-info">
                      📦 Shipping charges extra
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="Craftified Memories Logo" className="footer-logo-image" />
              <span className="footer-text">© 2024 Craftified Memories - Handcrafted with Love</span>
            </div>
            <div className="footer-social">
              <a href="https://wa.me/9550266837" target="_blank" rel="noopener noreferrer" className="footer-social-link whatsapp">
                💬 WhatsApp Us
              </a>
              <a href="https://www.instagram.com/craftifiedmemories/" target="_blank" rel="noopener noreferrer" className="footer-social-link instagram">
                📷 @craftifiedmemories
              </a>
            </div>
          </div>
          <div className="shipping-info-section">
            <div className="shipping-header">
              📦 Shipping Information
            </div>
            <p className="shipping-details">
              Shipping charges are extra for all products. Please contact us for shipping details and rates.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
