import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tests } from '../api/client';

export default function LiveTestPage() {
    const [liveTest, setLiveTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        tests.live()
            .then(r => setLiveTest(r.data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loader"><div className="spinner" /></div>;

    return (
        <div className="page container">
            <h1 className="section-title fade-in">Live Test</h1>

            {error && (
                <div className="empty-state fade-in">
                    <div className="icon"></div>
                    <p>No live test available right now. Check back soon!</p>
                </div>
            )}

            {liveTest && (
                <div className="card fade-in" style={{ maxWidth: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-red)', animation: 'pulse 1.5s infinite' }} />
                        <span className="badge badge-red">LIVE NOW</span>
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>{liveTest.title}</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{liveTest.questionCount} questions</p>
                    {liveTest.scheduledAt && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                            Scheduled: {new Date(liveTest.scheduledAt).toLocaleString()}
                        </p>
                    )}
                    <Link to={`/test/${liveTest.id}`} className="btn btn-primary">Start Test →</Link>
                </div>
            )}
        </div>
    );
}
