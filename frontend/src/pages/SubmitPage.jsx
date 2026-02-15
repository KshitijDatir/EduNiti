import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';

const SUBMIT_URL = 'http://192.168.49.2/submit';

export default function SubmitPage() {
    const { testId } = useParams();
    const location = useLocation();
    const state = location.state;
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [response, setResponse] = useState(null);

    const handleSubmit = async () => {
        setStatus('sending');
        try {
            const res = await fetch(SUBMIT_URL, {
                method: 'POST',
                body: 'data:test',
                mode: 'no-cors',
            });
            // no-cors gives opaque response, treat as success if no network error
            setStatus('success');
            setResponse('Request sent successfully (opaque response — no-cors mode)');
        } catch (err) {
            setStatus('error');
            setResponse(err.message);
        }
    };

    return (
        <div className="page container">
            <div className="card fade-in" style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>Submit</div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12 }}>Submit Test</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
                    {state?.test ? `Test: ${state.test.title}` : `Test ID: ${testId}`}
                </p>
                <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.85rem' }}>
                    Target: <code style={{ color: 'var(--accent-cyan)' }}>{SUBMIT_URL}</code>
                </p>

                {status === 'idle' && (
                    <button className="btn btn-primary" onClick={handleSubmit} style={{ marginTop: 20 }}>
                        Submit (1 Request) →
                    </button>
                )}

                {status === 'sending' && (
                    <div style={{ marginTop: 20 }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                        <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.85rem' }}>Sending...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        color: 'var(--accent-green)',
                        fontSize: '0.85rem',
                        margin: '20px 0',
                    }}>
                        {response}
                    </div>
                )}

                {status === 'error' && (
                    <div className="error-box" style={{ margin: '20px 0' }}>
                        ❌ {response}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                    <Link to="/dashboard" className="btn btn-secondary">← Dashboard</Link>
                    <Link to="/loadtest" className="btn btn-primary">Load Test</Link>
                </div>
            </div>
        </div>
    );
}
