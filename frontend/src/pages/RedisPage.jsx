import { useState, useEffect, useRef } from 'react';
import { tests } from '../api/client';
import './RedisPage.css';

const POLL_INTERVAL = 2000; // 2 seconds

export default function RedisPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [polling, setPolling] = useState(true);
    const timerRef = useRef(null);

    const fetchStats = async () => {
        try {
            const res = await tests.cacheStats();
            setStats(res.data);
            setError('');

            // Track history for the chart
            setHistory(prev => {
                const next = [...prev, {
                    ts: Date.now(),
                    hits: res.data.app.hits,
                    misses: res.data.app.misses,
                    hitRate: res.data.app.hitRate,
                }];
                return next.slice(-30); // Keep last 30 data points
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        if (polling) {
            timerRef.current = setInterval(fetchStats, POLL_INTERVAL);
        }
        return () => clearInterval(timerRef.current);
    }, [polling]);

    const handleReset = async () => {
        await tests.cacheReset();
        setHistory([]);
        fetchStats();
    };

    const triggerCacheHit = async () => {
        // Fetch the live test twice — first may miss, second should hit
        try {
            const live = await tests.live();
            if (live.data?.id) {
                await tests.getById(live.data.id); // May be miss or hit
                await tests.getById(live.data.id); // Should be hit
            }
            fetchStats();
        } catch { /* ignore */ }
    };

    const triggerCacheMiss = async () => {
        // Fetch a fake test ID to trigger a miss
        try {
            await tests.getById('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
        } catch { /* expected 404 */ }
        fetchStats();
    };

    if (loading) return <div className="loader"><div className="spinner" /></div>;

    const app = stats?.app || {};
    const server = stats?.server || {};
    const latency = stats?.latency || [];

    // Calculate avg latency for hits vs misses
    const hitLatencies = latency.filter(l => l.type === 'hit');
    const missLatencies = latency.filter(l => l.type === 'miss');
    const avgHitMs = hitLatencies.length ? (hitLatencies.reduce((a, l) => a + l.ms, 0) / hitLatencies.length).toFixed(2) : '-';
    const avgMissMs = missLatencies.length ? (missLatencies.reduce((a, l) => a + l.ms, 0) / missLatencies.length).toFixed(2) : '-';

    // Bar chart for hit rate history
    const maxHitRate = 100;

    return (
        <div className="page container">
            <div className="redis-header fade-in">
                <div>
                    <h1>Redis Cache Analytics</h1>
                    <p>Real-time monitoring of cache performance</p>
                </div>
                <div className="redis-header-actions">
                    <button
                        className={`btn ${polling ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => setPolling(!polling)}
                        style={{ fontSize: '0.8rem' }}
                    >
                        {polling ? 'Pause' : 'Resume'} Auto-Refresh
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset} style={{ fontSize: '0.8rem' }}>
                        Reset Counters
                    </button>
                </div>
            </div>

            {error && <div className="error-box fade-in">{error}</div>}

            {/* Why Redis Section */}
            <div className="card fade-in redis-why">
                <h2>Why Redis?</h2>
                <div className="why-grid">
                    <div className="why-item">
                        <div className="why-title">Speed</div>
                        <div className="why-desc">In-memory data store. Sub-millisecond reads vs 5-50ms database queries.</div>
                    </div>
                    <div className="why-item">
                        <div className="why-title">Reduced DB Load</div>
                        <div className="why-desc">Repeated test fetches hit cache, not PostgreSQL. Critical under high concurrency.</div>
                    </div>
                    <div className="why-item">
                        <div className="why-title">TTL-Based Expiry</div>
                        <div className="why-desc">Cached data auto-expires, ensuring students always get fresh test content.</div>
                    </div>
                    <div className="why-item">
                        <div className="why-title">Fail-Open Design</div>
                        <div className="why-desc">If Redis goes down, the app falls back to direct DB queries. No downtime.</div>
                    </div>
                </div>
            </div>

            {/* App-Level Stats */}
            <div className="stats-grid slide-up" style={{ marginTop: 24 }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{app.hits?.toLocaleString()}</div>
                    <div className="stat-label">Cache Hits</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{app.misses?.toLocaleString()}</div>
                    <div className="stat-label">Cache Misses</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{app.hitRate}%</div>
                    <div className="stat-label">Hit Rate</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{app.totalRequests?.toLocaleString()}</div>
                    <div className="stat-label">Total Requests</div>
                </div>
            </div>

            {/* Hit Rate Chart */}
            <div className="card slide-up" style={{ marginTop: 24 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Hit Rate Over Time</h2>
                {history.length > 1 ? (
                    <div className="chart-container">
                        <div className="chart-y-axis">
                            <span>100%</span>
                            <span>50%</span>
                            <span>0%</span>
                        </div>
                        <div className="chart-bars">
                            {history.map((h, i) => (
                                <div key={i} className="chart-bar-wrapper" title={`${h.hitRate}% (${h.hits}H / ${h.misses}M)`}>
                                    <div
                                        className="chart-bar"
                                        style={{
                                            height: `${(h.hitRate / maxHitRate) * 100}%`,
                                            background: h.hitRate >= 80
                                                ? 'var(--accent-green)'
                                                : h.hitRate >= 50
                                                    ? 'var(--accent-orange)'
                                                    : 'var(--accent-red)',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Collecting data... Make some requests to see the chart.
                    </p>
                )}
            </div>

            {/* Latency Comparison */}
            <div className="card slide-up" style={{ marginTop: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Latency Comparison (Redis vs DB)</h2>
                <div className="latency-compare">
                    <div className="latency-bar-group">
                        <div className="latency-label">Cache HIT (Redis)</div>
                        <div className="latency-bar-track">
                            <div
                                className="latency-bar-fill latency-hit"
                                style={{ width: avgHitMs !== '-' ? `${Math.min(parseFloat(avgHitMs) / 5 * 100, 100)}%` : '5%' }}
                            />
                        </div>
                        <div className="latency-value">{avgHitMs} ms</div>
                    </div>
                    <div className="latency-bar-group">
                        <div className="latency-label">Cache MISS (DB)</div>
                        <div className="latency-bar-track">
                            <div
                                className="latency-bar-fill latency-miss"
                                style={{ width: avgMissMs !== '-' ? `${Math.min(parseFloat(avgMissMs) / 5 * 100, 100)}%` : '5%' }}
                            />
                        </div>
                        <div className="latency-value">{avgMissMs} ms</div>
                    </div>
                </div>
            </div>

            {/* Redis Server Stats */}
            <div className="card slide-up" style={{ marginTop: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Redis Server Info</h2>
                <div className="table-wrapper">
                    <table>
                        <tbody>
                            <tr><td style={{ fontWeight: 600 }}>Used Memory</td><td>{server.usedMemory}</td></tr>
                            <tr><td style={{ fontWeight: 600 }}>Peak Memory</td><td>{server.usedMemoryPeak}</td></tr>
                            <tr><td style={{ fontWeight: 600 }}>Server Keyspace Hits</td><td>{server.keyspaceHits?.toLocaleString()}</td></tr>
                            <tr><td style={{ fontWeight: 600 }}>Server Keyspace Misses</td><td>{server.keyspaceMisses?.toLocaleString()}</td></tr>
                            <tr><td style={{ fontWeight: 600 }}>Total Commands</td><td>{server.totalCommandsProcessed?.toLocaleString()}</td></tr>
                            <tr><td style={{ fontWeight: 600 }}>Cached Test Keys</td><td>{stats?.keys?.testKeys}</td></tr>
                            <tr><td style={{ fontWeight: 600 }}>App Uptime</td><td>{app.uptimeSeconds}s</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Demo Buttons */}
            <div className="card slide-up" style={{ marginTop: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Simulate Cache Activity</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                    Trigger real requests to see hits and misses update in real time.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" onClick={triggerCacheHit}>
                        Trigger Cache Hit
                    </button>
                    <button className="btn btn-secondary" onClick={triggerCacheMiss}>
                        Trigger Cache Miss
                    </button>
                </div>
            </div>

            {/* Live Latency Feed */}
            {latency.length > 0 && (
                <div className="card slide-up" style={{ marginTop: 20 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Recent Requests</h2>
                    <div className="latency-feed">
                        {latency.slice(-15).reverse().map((l, i) => (
                            <div key={i} className={`feed-item ${l.type}`}>
                                <span className={`feed-badge ${l.type === 'hit' ? 'badge-green' : 'badge-red'}`}>
                                    {l.type.toUpperCase()}
                                </span>
                                <span className="feed-ms">{l.ms}ms</span>
                                <span className="feed-time">{new Date(l.ts).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
