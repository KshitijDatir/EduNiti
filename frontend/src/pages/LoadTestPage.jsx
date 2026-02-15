import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LoadTestPage.css';

const TARGET_URL = 'http://192.168.49.2/submit';
const TOTAL_REQUESTS = 20000;
const CONCURRENCY = 200;
const BODY = 'data:test';

export default function LoadTestPage() {
    const [status, setStatus] = useState('idle'); // idle | running | done
    const [progress, setProgress] = useState({ completed: 0, errors: 0, rps: 0 });
    const [result, setResult] = useState(null);
    const abortRef = useRef(false);

    const runLoadTest = async () => {
        abortRef.current = false;
        setStatus('running');
        setProgress({ completed: 0, errors: 0, rps: 0 });
        setResult(null);

        let completed = 0;
        let errors = 0;
        const startTime = performance.now();
        let lastUpdate = startTime;

        const updateProgress = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const rps = elapsed > 0 ? Math.round(completed / elapsed) : 0;
            setProgress({ completed, errors, rps });
        };

        // Worker function — each worker sends requests sequentially
        const worker = async () => {
            while (completed + errors < TOTAL_REQUESTS && !abortRef.current) {
                try {
                    await fetch(TARGET_URL, {
                        method: 'POST',
                        body: BODY,
                        mode: 'no-cors',
                    });
                    completed++;
                } catch {
                    errors++;
                }

                // Throttle UI updates to every 100 requests
                if ((completed + errors) % 100 === 0 || performance.now() - lastUpdate > 200) {
                    lastUpdate = performance.now();
                    updateProgress();
                }
            }
        };

        // Launch CONCURRENCY workers in parallel
        const workers = Array.from({ length: CONCURRENCY }, () => worker());
        await Promise.all(workers);

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
        const avgRps = (completed / parseFloat(totalTime)).toFixed(0);

        const finalResult = {
            totalRequests: completed + errors,
            successful: completed,
            failed: errors,
            totalTime: `${totalTime}s`,
            avgRps,
            concurrency: CONCURRENCY,
        };

        setResult(finalResult);
        setProgress({ completed, errors, rps: parseInt(avgRps) });
        setStatus('done');
    };

    const stopTest = () => {
        abortRef.current = true;
    };

    const resetTest = () => {
        setStatus('idle');
        setProgress({ completed: 0, errors: 0, rps: 0 });
        setResult(null);
    };

    const pct = Math.round(((progress.completed + progress.errors) / TOTAL_REQUESTS) * 100);

    const heyCommand = `hey -n ${TOTAL_REQUESTS} -c ${CONCURRENCY} -m POST -d "${BODY}" ${TARGET_URL}`;

    return (
        <div className="page container">
            <h1 className="section-title fade-in">Load Test</h1>

            {/* Config Card */}
            <div className="card fade-in" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Configuration</h2>
                <div className="loadtest-config">
                    <div className="config-item">
                        <span className="config-label">Target</span>
                        <code className="config-value">{TARGET_URL}</code>
                    </div>
                    <div className="config-item">
                        <span className="config-label">Total Requests</span>
                        <span className="config-value">{TOTAL_REQUESTS.toLocaleString()}</span>
                    </div>
                    <div className="config-item">
                        <span className="config-label">Concurrency</span>
                        <span className="config-value">{CONCURRENCY} users</span>
                    </div>
                    <div className="config-item">
                        <span className="config-label">Method</span>
                        <span className="config-value">POST</span>
                    </div>
                    <div className="config-item">
                        <span className="config-label">Body</span>
                        <code className="config-value">{BODY}</code>
                    </div>
                </div>
            </div>

            {/* Action */}
            <div className="loadtest-actions fade-in">
                {status === 'idle' && (
                    <button className="btn btn-primary btn-lg" onClick={runLoadTest}>
                        Run Load Test ({TOTAL_REQUESTS.toLocaleString()} requests)
                    </button>
                )}
                {status === 'running' && (
                    <button className="btn btn-secondary btn-lg" onClick={stopTest} style={{ borderColor: 'var(--accent-red)' }}>
                        Stop Test
                    </button>
                )}
                {status === 'done' && (
                    <button className="btn btn-primary btn-lg" onClick={resetTest}>
                        Run Again
                    </button>
                )}
            </div>

            {/* Progress */}
            {status !== 'idle' && (
                <div className="card slide-up" style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                            {status === 'running' ? 'Running...' : 'Complete'}
                        </h2>
                        <span className="badge badge-blue">{pct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="test-progress-bar" style={{ marginBottom: 20 }}>
                        <div className="test-progress-fill" style={{ width: `${pct}%`, transition: 'width 0.15s ease' }} />
                    </div>

                    {/* Live stats */}
                    <div className="stats-grid" style={{ marginBottom: 0 }}>
                        <div className="stat-card">
                            <div className="stat-value">{progress.completed.toLocaleString()}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: progress.errors > 0 ? 'var(--accent-red)' : undefined }}>
                                {progress.errors.toLocaleString()}
                            </div>
                            <div className="stat-label">Errors</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{progress.rps.toLocaleString()}</div>
                            <div className="stat-label">Req/sec</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Final Results */}
            {result && (
                <div className="card slide-up" style={{ marginTop: 20 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Results</h2>
                    <div className="table-wrapper">
                        <table>
                            <tbody>
                                <tr><td style={{ fontWeight: 600 }}>Total Requests</td><td>{result.totalRequests.toLocaleString()}</td></tr>
                                <tr><td style={{ fontWeight: 600 }}>Successful</td><td><span className="badge badge-green">{result.successful.toLocaleString()}</span></td></tr>
                                <tr><td style={{ fontWeight: 600 }}>Failed</td><td><span className={`badge ${result.failed > 0 ? 'badge-red' : 'badge-green'}`}>{result.failed.toLocaleString()}</span></td></tr>
                                <tr><td style={{ fontWeight: 600 }}>Total Time</td><td>{result.totalTime}</td></tr>
                                <tr><td style={{ fontWeight: 600 }}>Avg RPS</td><td>{result.avgRps} req/s</td></tr>
                                <tr><td style={{ fontWeight: 600 }}>Concurrency</td><td>{result.concurrency} workers</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Hey CLI command */}
            <div className="card fade-in" style={{ marginTop: 24 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
                    CLI Alternative (<code style={{ color: 'var(--accent-cyan)' }}>hey</code>)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                    For more accurate benchmarking, run this command in your terminal:
                </p>
                <div className="cli-command">
                    <code>{heyCommand}</code>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { navigator.clipboard.writeText(heyCommand); }}
                        title="Copy to clipboard"
                    >
                        Copy
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 24 }}>
                <Link to="/dashboard" className="btn btn-secondary">← Dashboard</Link>
            </div>
        </div>
    );
}
