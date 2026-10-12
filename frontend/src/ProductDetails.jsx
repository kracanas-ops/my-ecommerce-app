import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from './CartContext';
import './App.css';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`https://my-ecommerce-app.onrender.com/api/products/${id}`)
      .then(res => res.json())
      .then(data => setProduct(data))
      .catch(err => console.error(err));
  }, [id]);

  if (!product) return <div className="hero" style={{ paddingTop: '150px' }}>Loading module...</div>;

  return (
    <div className="main-content" style={{ paddingTop: '100px', maxWidth: '800px' }}>
      <Link to="/" style={{ color: '#71717a', textDecoration: 'none' }}>← Back to Catalog</Link>
      
      <div className="product-card" style={{ marginTop: '30px', padding: '40px', cursor: 'default' }}>
        <div className="product-image-placeholder" style={{ height: '400px', marginBottom: '30px' }}>
          <span className="floating-icon">✧</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{product.name}</h1>
        <p style={{ color: '#a1a1aa', marginBottom: '20px' }}>Units Available: {product.stock}</p>
        <p style={{ color: '#ececec', fontSize: '1.1rem', marginBottom: '40px', lineHeight: '1.6' }}>
          Premium digital asset optimized for high-performance applications. Includes lifetime updates and commercial licensing.
        </p>
        <button 
          className="product-price" 
          onClick={() => addToCart(product)}
          style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}
        >
          Add to Cart - ${product.price}
        </button>
      </div>
    </div>
  );
}