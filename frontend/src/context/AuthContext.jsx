import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, setTokenGetter } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => sessionStorage.getItem('xenia_token'));
    const [loading, setLoading] = useState(!!sessionStorage.getItem('xenia_token'));

    // Register the token getter for the API client
    useEffect(() => {
        setTokenGetter(() => token);
    }, [token]);

    // Verify token on mount
    useEffect(() => {
        if (!token) { setLoading(false); return; }
        authApi.me()
            .then((res) => setUser(res.data))
            .catch(() => { setToken(null); sessionStorage.removeItem('xenia_token'); })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await authApi.login(email, password);
        setToken(res.data.token);
        setUser(res.data.user);
        sessionStorage.setItem('xenia_token', res.data.token);
        return res.data;
    }, []);

    const register = useCallback(async (email, name, password) => {
        const res = await authApi.register(email, name, password);
        setToken(res.data.token);
        setUser(res.data.user);
        sessionStorage.setItem('xenia_token', res.data.token);
        return res.data;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('xenia_token');
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
