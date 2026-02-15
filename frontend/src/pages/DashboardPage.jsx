import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboard, tests } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [results, setResults] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [liveTest, setLiveTest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            dashboard.profile().then(r => setProfile(r.data)),
            dashboard.results().then(r => setResults(r.data)),
            dashboard.sessions().then(r => setSessions(r.data)),
            dashboard.upcomingTests().then(r => setUpcoming(r.data)),
            tests.live().then(r => setLiveTest(r.data)).catch(() => null),
        ]).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loader"><div className="spinner" /></div>;

    const avgScore = results.length
        ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length)
        : 0;

    return (
        <div className="page container">
            {/* Hero */}
            <div className="dashboard-hero fade-in">
                <div className="hero-text">
                    <h1>Welcome back, <span className="gradient-text">{profile?.name || user?.name}</span></h1>
                    <p>Here's your learning overview</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid slide-up">
                <div className="stat-card">
                    <div className="stat-value">{results.length}</div>
                    <div className="stat-label">Tests Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{avgScore}%</div>
                    <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{sessions.filter(s => s.status === 'active').length}</div>
                    <div className="stat-label">Active Sessions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{upcoming.length}</div>
                    <div className="stat-label">Upcoming Tests</div>
                </div>
            </div>

            {/* Live Test Banner */}
            {liveTest && (
                <div className="live-banner slide-up">
                    <div className="live-dot" />
                    <div className="live-info">
                        <h3>Live Now: {liveTest.title}</h3>
                        <p>{liveTest.questionCount} questions</p>
                    </div>
                    <Link to={`/test/${liveTest.id}`} className="btn btn-primary">Take Test →</Link>
                </div>
            )}

            {/* Recent Results */}
            <div className="section slide-up">
                <h2 className="section-title">Recent Results</h2>
                {results.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Score</th>
                                    <th>Percentage</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.slice(0, 5).map(r => (
                                    <tr key={r.id}>
                                        <td>{r.testTitle}</td>
                                        <td>{r.score}/{r.totalQuestions}</td>
                                        <td>
                                            <span className={`badge ${r.percentage >= 80 ? 'badge-green' : r.percentage >= 50 ? 'badge-orange' : 'badge-red'}`}>
                                                {r.percentage}%
                                            </span>
                                        </td>
                                        <td>{new Date(r.completedAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="icon"></div>
                        <p>No results yet. Take a test to see your scores!</p>
                    </div>
                )}
            </div>

            {/* Upcoming Tests */}
            {upcoming.length > 0 && (
                <div className="section slide-up" style={{ marginTop: 32 }}>
                    <h2 className="section-title">Upcoming Tests</h2>
                    <div className="upcoming-grid">
                        {upcoming.map(t => (
                            <div key={t.id} className="card upcoming-card">
                                <h3>{t.title}</h3>
                                <p className="upcoming-desc">{t.description}</p>
                                <span className="badge badge-blue">{new Date(t.scheduledAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
