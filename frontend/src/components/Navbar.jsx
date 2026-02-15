import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="logo-icon"></span>
                    <span className="logo-text">EduNiti</span>
                </Link>

                {isAuthenticated ? (
                    <>
                        <div className="navbar-links">
                            <Link to="/dashboard">Dashboard</Link>
                            <Link to="/test">Live Test</Link>
                            <Link to="/videos">Videos</Link>
                            <Link to="/results">Results</Link>
                            <Link to="/loadtest">Load Test</Link>
                        </div>
                        <div className="navbar-user">
                            <span className="user-name">{user?.name || 'Student'}</span>
                            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
                )}
            </div>
        </nav>
    );
}
