import { useLocation, Link, useParams } from 'react-router-dom';

export default function VideoPlayerPage() {
    const { questionId } = useParams();
    const location = useLocation();
    const video = location.state?.video;

    if (!video || !video.mediaUrl) {
        return (
            <div className="page container">
                <div className="empty-state fade-in">
                    <div className="icon"></div>
                    <p>Video not available. <Link to="/videos">Back to library</Link></p>
                </div>
            </div>
        );
    }

    return (
        <div className="page container">
            <div className="fade-in" style={{ marginBottom: 24 }}>
                <Link to="/videos" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Videos</Link>
            </div>

            <div className="slide-up" style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{
                    background: '#000',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    marginBottom: 24,
                    boxShadow: 'var(--shadow-lg)',
                }}>
                    <video
                        src={video.mediaUrl}
                        controls
                        autoPlay
                        playsInline
                        style={{ width: '100%', display: 'block' }}
                    />
                </div>

                <div className="card" style={{ border: 'none' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>{video.questionText}</h1>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-green">Video</span>
                        {video.mediaUrl.includes('cloudfront.net') && (
                            <span className="badge badge-purple">CDN Delivered</span>
                        )}
                    </div>

                    {/* Options */}
                    {video.options && video.options.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                Related Question
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {video.options.map((opt, i) => (
                                    <div key={opt.id} style={{
                                        padding: '12px 16px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        gap: 10,
                                        alignItems: 'center',
                                    }}>
                                        <span style={{
                                            width: 28, height: 28, borderRadius: 6,
                                            background: 'var(--bg-card)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        {opt.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
