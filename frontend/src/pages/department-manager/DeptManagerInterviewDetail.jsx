import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';

export default function DeptManagerInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({
    scores: [],
    comment: '',
    decision: '' // 'PASS' or 'REJECT'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const data = await deptManagerService.interviews.getById(id);
      setInterview(data);
      
      // Initialize scores if evaluation criteria exist
      if (data.evaluationCriteria) {
        setFeedback(prev => ({
          ...prev,
          scores: data.evaluationCriteria.map(c => ({
            criterionId: c.id,
            score: 0
          }))
        }));
      }
    } catch (error) {
      console.error('Failed to load interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criterionId, score) => {
    setFeedback(prev => ({
      ...prev,
      scores: prev.scores.map(s => 
        s.criterionId === criterionId ? { ...s, score } : s
      )
    }));
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) {
      alert('Please select a decision (Pass/Reject)');
      return;
    }

    try {
      setSubmitting(true);
      await deptManagerService.interviews.submitFeedback(id, feedback);
      alert('Feedback submitted successfully!');
      navigate('/staff/dept-manager/interviews');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const isPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!interview) {
    return <div style={{ padding: 24 }}>Interview not found</div>;
  }

  const canEvaluate = isPast(interview.endTime) && !interview.hasMyFeedback;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/staff/dept-manager/interviews')}
          style={{
            marginBottom: 16,
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          ← Back to Interviews
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Interview Details
        </h1>
      </div>

      {/* Main Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Candidate</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{interview.candidateName}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Position</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{interview.positionTitle}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Round</div>
            <div style={{ fontSize: 16 }}>Round {interview.roundNo}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status</div>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: isUpcoming(interview.startTime) ? '#dbeafe' : '#d1fae5',
              color: isUpcoming(interview.startTime) ? '#1e40af' : '#065f46',
              borderRadius: 16,
              fontSize: 14,
              fontWeight: 500
            }}>
              {isUpcoming(interview.startTime) ? 'Upcoming' : 'Completed'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Start Time</div>
            <div style={{ fontSize: 16 }}>📅 {formatDateTime(interview.startTime)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>End Time</div>
            <div style={{ fontSize: 16 }}>📅 {formatDateTime(interview.endTime)}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Location</div>
            <div style={{ fontSize: 16 }}>
              📍 {interview.location || interview.meetingLink || 'TBA'}
            </div>
          </div>
        </div>

        {/* Participants */}
        {interview.participants && interview.participants.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Interview Panel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interview.participants.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    backgroundColor: '#f9fafb',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{p.role}</div>
                  </div>
                  {p.hasFeedback && (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      ✓ Evaluated
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidate CV Summary */}
        {interview.candidateProfile && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Candidate Profile</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
              {interview.candidateProfile.summary || 'No summary available'}
            </div>
            {interview.candidateProfile.yearsOfExperience !== undefined && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                Experience: {interview.candidateProfile.yearsOfExperience} years
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evaluation Form */}
      {canEvaluate && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Submit Your Evaluation</h2>

          {/* Evaluation Criteria */}
          {interview.evaluationCriteria && interview.evaluationCriteria.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Evaluation Criteria</div>
              {interview.evaluationCriteria.map((criterion) => {
                const currentScore = feedback.scores.find(s => s.criterionId === criterion.id)?.score || 0;
                return (
                  <div
                    key={criterion.id}
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      backgroundColor: '#f9fafb',
                      borderRadius: 6
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{criterion.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Max: {criterion.maxScore} points
                      </div>
                    </div>
                    {criterion.description && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                        {criterion.description}
                      </div>
                    )}
                    <input
                      type="number"
                      min="0"
                      max={criterion.maxScore}
                      value={currentScore}
                      onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 14
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Comments */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Your Comments
            </label>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your evaluation notes and observations..."
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Decision */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Your Decision *
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setFeedback(prev => ({ ...prev, decision: 'PASS' }))}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: feedback.decision === 'PASS' ? '#10b981' : 'white',
                  color: feedback.decision === 'PASS' ? 'white' : '#374151',
                  border: `2px solid ${feedback.decision === 'PASS' ? '#10b981' : '#d1d5db'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                ✓ Pass
              </button>
              <button
                onClick={() => setFeedback(prev => ({ ...prev, decision: 'REJECT' }))}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  backgroundColor: feedback.decision === 'REJECT' ? '#ef4444' : 'white',
                  color: feedback.decision === 'REJECT' ? 'white' : '#374151',
                  border: `2px solid ${feedback.decision === 'REJECT' ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                ✗ Reject
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitFeedback}
            disabled={submitting || !feedback.decision}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: submitting || !feedback.decision ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
              opacity: submitting || !feedback.decision ? 0.6 : 1
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      )}

      {/* Already Evaluated Message */}
      {interview.hasMyFeedback && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>
            ✓ Evaluation Submitted
          </div>
          <div style={{ color: '#047857' }}>
            You have already submitted your evaluation for this interview.
          </div>
        </div>
      )}

      {/* Upcoming Interview Message */}
      {isUpcoming(interview.startTime) && (
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>
            ⏰ Upcoming Interview
          </div>
          <div style={{ color: '#1e40af' }}>
            You can submit your evaluation after the interview ends.
          </div>
        </div>
      )}
    </div>
  );
}
