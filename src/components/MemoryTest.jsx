import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './MemoryTest.css';

const MemoryTest = forwardRef(({ correctPassword, onReset }, ref) => {
  const [attempt, setAttempt] = useState('');
  const [showAttempt, setShowAttempt] = useState(false);
  const [triesLeft, setTriesLeft] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);

  useEffect(() => {
    if (status !== 'idle') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [status]);

  useImperativeHandle(ref, () => ({
    check: () => {
      if (status !== 'idle') return;
      if (attempt === correctPassword) {
        clearInterval(timerRef.current);
        setStatus('success');
        return;
      }
      const newTries = triesLeft - 1;
      setTriesLeft(newTries);
      setAttempt('');
      if (newTries === 0) {
        clearInterval(timerRef.current);
        setStatus('failed');
      }
    }
  }));

  const timerClass =
    timeLeft > 30 ? 'memory-timer green' :
    timeLeft > 10 ? 'memory-timer yellow' :
                    'memory-timer red';

  return (
    <div className="memory-test-section">
      <h3 className="memory-test-title">🧠 Memory Test</h3>
      <p className="memory-test-desc">
        Can you remember your password? Type it below without looking!
      </p>

      {status === 'idle' && (
        <>
          <div className="memory-test-meta">
            <span className={timerClass}>⏱ {timeLeft}s</span>
            <span className="memory-tries">
              {'❤️'.repeat(triesLeft)}{'🖤'.repeat(3 - triesLeft)}
            </span>
          </div>

          <div className="memory-input-wrapper">
            <input
              type={showAttempt ? 'text' : 'password'}
              className="input-field memory-input"
              placeholder="Re-enter your password..."
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  ref.current?.check();
                }
              }}
              onPaste={(e) => e.preventDefault()}
              autoFocus
            />
            <button
              type="button"
              className="memory-eye-button"
              onClick={() => setShowAttempt(p => !p)}
            >
              {showAttempt ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </>
      )}

      {status === 'success' && (
        <div className="memory-result success">
          ✅ Great job! You remembered your password!
          <button type="button" className="memory-reset" onClick={onReset}>Test again</button>
        </div>
      )}

      {status === 'failed' && (
        <div className="memory-result failed">
          ❌ Out of tries! The password was: <strong>{correctPassword}</strong>
          <button type="button" className="memory-reset" onClick={onReset}>Try again</button>
        </div>
      )}

      {status === 'timeout' && (
        <div className="memory-result timeout">
          ⏰ Time's up! The password was: <strong>{correctPassword}</strong>
          <button type="button" className="memory-reset" onClick={onReset}>Try again</button>
        </div>
      )}
    </div>
  );
});

export default MemoryTest;