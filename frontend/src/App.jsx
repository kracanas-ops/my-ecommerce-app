import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { CartProvider, useCart } from './CartContext';
import Auth from './Auth';
import ProductDetails from './ProductDetails';
import Cart from './Cart';
import './App.css';

function Home() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart(); // Access the cart function

  useEffect(() => {
    fetch('https://my-ecommerce-app.onrender.com/api/products')
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error('Error fetching products:', error));
  }, []);

  return (
    <>
      <header className="hero">
        <h1>The future of commerce.</h1>
        <p>Ultimate Framer template to transform your website into an eCommerce powerhouse. Sell digital products easily & beautifully.</p>
        <input type="text" className="search-bar" placeholder="🔍 Search digital assets..." />
      </header>

      <main className="main-content">
        <h2 className="section-title">Premium Products</h2>
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                <div className="product-image-placeholder">
                  <span className="floating-icon">✧</span>
                </div>
              </Link>
              <div className="product-details">
                <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', flexGrow: 1 }}>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">Units Available: {product.stock}</p>
                </Link>
                {/* Prevent link click when adding to cart */}
                <button 
                  className="product-price" 
                  onClick={(e) => { e.preventDefault(); addToCart(product); }}
                >
                  ${product.price}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

// NavBar component separated to access useCart hook
function NavBar() {
  const { totalItems } = useCart();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <span style={{ fontSize: '1.5rem', color: '#fff' }}>✧</span> Commerce
      </Link>
      
      <div className="nav-links">
        <Link to="#">Templates</Link>
        <Link to="#">Backgrounds</Link>
      </div>
      
      <div className="nav-links" style={{ alignItems: 'center' }}>
        <Link to="/signin">Sign In</Link>
        <Link to="/cart" className="btn-premium" style={{ display: 'flex', gap: '8px', alignItems: 'center', textDecoration: 'none' }}>
          Cart <span style={{ background: '#000', color: '#fff', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem' }}>{totalItems}</span>
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="app-container">
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<Auth />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/product/:id" element={<ProductDetails />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;