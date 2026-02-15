import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tests } from '../api/client';
import './TestPage.css';

export default function TestPage() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        tests.getById(testId)
            .then(r => setTest(r.data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [testId]);

    if (loading) return <div className="loader"><div className="spinner" /></div>;
    if (error) return <div className="page container"><div className="error-box">{error}</div></div>;
    if (!test) return <div className="page container"><div className="empty-state"><p>Test not found</p></div></div>;

    const questions = test.questions;
    const q = questions[currentQ];
    const progress = Math.round(((currentQ + 1) / questions.length) * 100);

    const selectOption = (optionId) => {
        setAnswers(prev => ({ ...prev, [q.id]: optionId }));
    };

    const handleSubmit = () => {
        const payload = Object.entries(answers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }));
        navigate(`/test/${testId}/submit`, { state: { answers: payload, test } });
    };

    return (
        <div className="page container">
            <div className="test-header fade-in">
                <h1>{test.title}</h1>
                <div className="test-progress-bar">
                    <div className="test-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="test-progress-text">Question {currentQ + 1} of {questions.length}</p>
            </div>

            <div className="test-question-card slide-up" key={q.id}>
                {/* Media */}
                {q.mediaUrl && q.mediaType === 'video' && (
                    <div className="test-media">
                        <video src={q.mediaUrl} controls playsInline style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
                    </div>
                )}

                <h2 className="question-text">{q.questionText}</h2>

                <div className="options-grid">
                    {q.options.map((opt, i) => (
                        <button
                            key={opt.id}
                            className={`option-btn ${answers[q.id] === opt.id ? 'selected' : ''}`}
                            onClick={() => selectOption(opt.id)}
                        >
                            <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                            <span>{opt.text}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="test-nav fade-in">
                <button className="btn btn-secondary" onClick={() => setCurrentQ(c => c - 1)} disabled={currentQ === 0}>
                    ← Previous
                </button>
                {currentQ < questions.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setCurrentQ(c => c + 1)}>
                        Next →
                    </button>
                ) : (
                    <button className="btn btn-primary" onClick={handleSubmit}>
                        Submit Test ✓
                    </button>
                )}
            </div>
        </div>
    );
}
