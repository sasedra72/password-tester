import React from 'react';
import './PasswordFeedback.css';

const CATEGORY_LABELS = {
  length:   '📏 Length / Passphrase',
  variety:  '🔡 Character Variety',
  personal: '👤 Personal Info',
  breach:   '🔒 Breach Check',
  pattern:  '🧠 Pattern / Entropy',
};

const PasswordFeedback = ({ score = 0, issues = [], breakdown = null }) => {
  const percentage = Math.round((score / 10) * 100);

  let barColor = '#ef4444';
  let label = 'Very Weak';

  if (score <= 3)      { barColor = '#ef4444'; label = 'Very Weak'; }
  else if (score <= 5) { barColor = '#f59e0b'; label = 'Weak'; }
  else if (score <= 7) { barColor = '#3b82f6'; label = 'Good'; }
  else if (score <= 9) { barColor = '#10b981'; label = 'Strong'; }
  else                 { barColor = '#6366f1'; label = 'Very Strong'; }

  return (
    <div className="strength-feedback-section">

      {/* LABEL + SCORE */}
      <div className="strength-header">
        <span className="strength-label">Strength: <strong style={{ color: barColor }}>{label}</strong></span>
        <span className="strength-score">{score}/10</span>
      </div>

      {/* MAIN BAR */}
      <div className="strength-bar-wrapper">
        <div
          className="strength-bar-filler"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
            transition: 'width 0.5s ease, background-color 0.5s ease',
          }}
        />
      </div>

      {/* BREAKDOWN */}
      {breakdown && (
        <div className="breakdown-section">
          <p className="breakdown-title">Score Breakdown</p>
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="breakdown-row">
              <span className="breakdown-label">{CATEGORY_LABELS[key]}</span>
              <div className="breakdown-bar-wrapper">
                <div
                  className="breakdown-bar-filler"
                  style={{
                    width: `${(val / 2) * 100}%`,
                    backgroundColor: val === 2 ? '#10b981' : val === 1 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.5s ease, background-color 0.5s ease',
                  }}
                />
              </div>
              <span className="breakdown-score">{val}/2</span>
            </div>
          ))}
        </div>
      )}

      {/* ISSUES */}
      <div className="feedback-panel">
        {issues.length === 0 ? (
          <p className="feedback-placeholder">✅ No issues found!</p>
        ) : (
          <ul className="issues-list">
            {issues.map((issue, index) => (
              <li key={index} className={`issue-item ${issue.type}`}>
                {issue.type === 'critical' && '🔴 '}
                {issue.type === 'personal' && '🟡 '}
                {issue.type === 'weak'     && '🟠 '}
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default PasswordFeedback;