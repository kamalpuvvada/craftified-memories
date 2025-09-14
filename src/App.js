import React, { useState, useEffect } from 'react';
import './App.css';
import logo from './logo.jpeg'; // Import your logo

const App = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    images: [], // Changed from single image to array
    imagePreviews: [] // Changed from single preview to array
  });


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

  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file],
          imagePreviews: [...prev.imagePreviews, event.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
      imagePreviews: prev.imagePreviews.filter((_, index) => index !== indexToRemove)
    }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(product =>
        product.id === editingProduct.id
          ? { ...formData, id: editingProduct.id }
          : product
      ));
      setEditingProduct(null);
    } else {
      const newProduct = {
        ...formData,
        id: Date.now(),
        price: parseFloat(formData.price)
      };
      setProducts([...products, newProduct]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '',
      images: [], // Reset to empty array
      imagePreviews: [] // Reset to empty array
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
            <button className="header-btn add-btn" onClick={() => setShowAddForm(true)}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Product
            </button>
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
                <p>Every design is made just for you</p>
              </div>
              <div className="feature-card">
                <h4>Handcrafted with care</h4>
                <p>Using premium papers, durable materials, and fine detailing</p>
              </div>
              <div className="feature-card">
                <h4>Versatile & creative</h4>
                <p>Perfect for birthdays, weddings, anniversaries, newborn milestones, festive occasions, or as thoughtful return gifts</p>
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

      {/* Add/Edit Product Modal */}
      {showAddForm && (
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
                        <img src={preview} alt={`Preview ${index + 1}`} className="thumbnail-image" />
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

      {/* Filter Section - Simplified Structure */}
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



      {/* Products Section - Separate */}
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
                      <button onClick={() => handleEdit(product)} className="action-btn edit-btn">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="action-btn delete-btn">
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="product-image-container">
                    {product.imagePreview ? (
                      <img src={product.imagePreview} alt={product.name} className="product-image" />
                    ) : (
                      <div className="product-placeholder">
                        <div className="placeholder-icon">📦</div>
                      </div>
                    )}
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
