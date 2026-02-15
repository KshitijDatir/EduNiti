import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tests } from '../api/client';
import './VideosPage.css';

// Hardcoded media test ID — will be fetched dynamically via live test
const MEDIA_TEST_TITLE = 'Video Learning Module';

export default function VideosPage() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [testId, setTestId] = useState('');

    useEffect(() => {
        // First get the live test, then fetch its details to extract video questions
        tests.live()
            .then(r => {
                setTestId(r.data.id);
                return tests.getById(r.data.id);
            })
            .then(r => {
                // Filter questions that have mediaType === 'video'
                const videoQuestions = r.data.questions.filter(q => q.mediaType === 'video');
                setVideos(videoQuestions);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loader"><div className="spinner" /></div>;

    return (
        <div className="page container">
            <div className="videos-header fade-in">
                <h1>Video Library</h1>
                <p>Watch educational content from your courses</p>
            </div>

            {error && (
                <div className="empty-state fade-in">
                    <div className="icon"></div>
                    <p>No video content available at the moment.</p>
                </div>
            )}

            <div className="videos-grid">
                {videos.map((video, i) => (
                    <div key={video.id} className={`video-card card slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="video-thumbnail">
                            {video.mediaUrl ? (
                                <>
                                    <video src={video.mediaUrl} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                                    <div className="play-overlay">▶</div>
                                </>
                            ) : (
                                <div className="no-video">
                                    <span></span>
                                    <small>Coming Soon</small>
                                </div>
                            )}
                        </div>
                        <div className="video-info">
                            <h3>{video.questionText}</h3>
                            <div className="video-meta">
                                {video.mediaUrl ? (
                                    <span className="badge badge-green">Available</span>
                                ) : (
                                    <span className="badge badge-orange">Not Uploaded</span>
                                )}
                            </div>
                        </div>
                        {video.mediaUrl ? (
                            <Link to={`/videos/${video.id}`} state={{ video, testId }} className="btn btn-primary btn-full" style={{ marginTop: 12 }}>
                                Watch Video →
                            </Link>
                        ) : (
                            <button className="btn btn-secondary btn-full btn-disabled" style={{ marginTop: 12 }}>
                                Coming Soon
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
