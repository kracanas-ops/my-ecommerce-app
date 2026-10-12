import { useCart } from './CartContext';
import { Link } from 'react-router-dom';
import './App.css';

export default function Cart() {
  const { cartItems, removeFromCart, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="hero" style={{ paddingTop: '150px' }}>
        <h1>Your Cart is Empty</h1>
        <p>Explore our premium assets and add them to your cart.</p>
        <Link to="/" className="btn-premium" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ paddingTop: '100px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>Checkout</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {cartItems.map((item) => (
          <div key={item.id} className="product-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '20px', cursor: 'default' }}>
            <div style={{ flexGrow: 1 }}>
              <h3 className="product-name">{item.name}</h3>
              <p className="product-category">Quantity: {item.quantity} x ${item.price}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '10px' }}>${(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="product-card" style={{ marginTop: '40px', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Total:</h2>
        <h2 style={{ fontSize: '2rem' }}>${cartTotal.toFixed(2)}</h2>
      </div>

      <button className="btn-premium" style={{ width: '100%', padding: '20px', fontSize: '1.2rem', marginTop: '20px' }}>
        Proceed to Payment
      </button>
    </div>
  );
}