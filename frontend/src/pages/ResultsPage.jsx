import { useState, useEffect } from 'react';
import { dashboard } from '../api/client';

export default function ResultsPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboard.results()
            .then(r => setResults(r.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loader"><div className="spinner" /></div>;

    const avgScore = results.length
        ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length)
        : 0;

    return (
        <div className="page container">
            <h1 className="section-title fade-in">Your Results</h1>

            {results.length > 0 && (
                <div className="stats-grid fade-in" style={{ marginBottom: 32 }}>
                    <div className="stat-card">
                        <div className="stat-value">{results.length}</div>
                        <div className="stat-label">Tests Taken</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{avgScore}%</div>
                        <div className="stat-label">Average</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{results.filter(r => r.percentage >= 80).length}</div>
                        <div className="stat-label">Passed (≥80%)</div>
                    </div>
                </div>
            )}

            {results.length > 0 ? (
                <div className="table-wrapper slide-up">
                    <table>
                        <thead>
                            <tr>
                                <th>Test</th>
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{r.testTitle}</td>
                                    <td>{r.score} / {r.totalQuestions}</td>
                                    <td>
                                        <span className={`badge ${r.percentage >= 80 ? 'badge-green' : r.percentage >= 50 ? 'badge-orange' : 'badge-red'}`}>
                                            {r.percentage}%
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(r.completedAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state slide-up">
                    <div className="icon"></div>
                    <p>No results yet. Complete a test to see your scores here!</p>
                </div>
            )}
        </div>
    );
}
