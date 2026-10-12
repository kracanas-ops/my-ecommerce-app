import { useState } from 'react';
import './App.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const response = await fetch(`https://my-ecommerce-app.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        if (data.token) {
          localStorage.setItem('userToken', data.token); // Save login token
          window.location.href = '/'; // Redirect to home
        }
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Server error. Backend might be offline.');
    }
  };

  return (
    <div className="hero" style={{ paddingTop: '100px' }}>
      <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
      <p>Secure access to the future of commerce.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}>
        <input 
          type="email" 
          placeholder="Email Address" 
          className="search-bar"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="search-bar"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn-premium" style={{ width: '100%', padding: '12px' }}>
          {isLogin ? 'Sign In' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '20px', color: '#a1a1aa' }}>
        {message}
      </p>

      <p 
        onClick={() => setIsLogin(!isLogin)} 
        style={{ marginTop: '20px', cursor: 'pointer', textDecoration: 'underline', color: '#71717a' }}
      >
        {isLogin ? "Need an account? Register here." : "Already have an account? Sign in."}
      </p>
    </div>
  );
}