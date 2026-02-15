import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, name, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container fade-in">
                <div className="login-header">
                    <span className="login-logo"></span>
                    <h1>Welcome to EduNiti</h1>
                    <p>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
                </div>

                <div className="login-tabs">
                    <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>
                        Sign In
                    </button>
                    <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>
                        Register
                    </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="name">Full Name</label>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <p className="login-footer">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button className="link-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                        {isLogin ? 'Register' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
}
