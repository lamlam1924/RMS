import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import { LoadingSpinner } from '../../components/shared';

export default function EmployeeInterviewDetail() {
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
      const data = await employeeService.interviews.getById(id);
      
      if (!data) {
        alert('Interview not found or you are not assigned to this interview');
        navigate('/staff/employee/interviews');
        return;
      }
      
      setInterview(data);
      
      // Initialize scores for evaluation criteria
      if (data.evaluationCriteria) {
        setFeedback(prev => ({
          ...prev,
          scores: data.evaluationCriteria.map(c => ({
            criteriaId: c.id,
            score: 0,
            comment: ''
          }))
        }));
      }
    } catch (error) {
      console.error('Failed to load interview:', error);
      alert('Failed to load interview details');
      navigate('/staff/employee/interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criteriaId, score) => {
    setFeedback(prev => ({
      ...prev,
      scores: prev.scores.map(s => 
        s.criteriaId === criteriaId ? { ...s, score: parseFloat(score) } : s
      )
    }));
  };

  const handleScoreCommentChange = (criteriaId, comment) => {
    setFeedback(prev => ({
      ...prev,
      scores: prev.scores.map(s => 
        s.criteriaId === criteriaId ? { ...s, comment } : s
      )
    }));
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.decision) {
      alert('Please select a decision (Pass/Reject)');
      return;
    }

    // Validate scores
    const hasEmptyScores = feedback.scores.some(s => s.score === 0 || s.score === '');
    if (hasEmptyScores) {
      alert('Please provide scores for all evaluation criteria');
      return;
    }

    try {
      setSubmitting(true);
      const result = await employeeService.interviews.submitFeedback(id, feedback);
      
      if (result.success) {
        alert('Feedback submitted successfully!');
        navigate('/staff/employee/interviews');
      } else {
        alert(result.message || 'Failed to submit feedback');
      }
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

  const isPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return <LoadingSpinner message="Loading interview details..." />;
  }

  if (!interview) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, color: '#6b7280' }}>Interview not found</div>
      </div>
    );
  }

  const canEvaluate = isPast(interview.endTime) && !interview.hasMyFeedback;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/staff/employee/interviews')}
          style={{
            marginBottom: 16,
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          ← Back to My Interviews
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Interview Details
        </h1>
      </div>

      {/* Interview Info Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Candidate</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{interview.candidate.fullName}</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>{interview.candidate.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Position</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{interview.positionTitle}</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>{interview.departmentName}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Interview Round</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Round {interview.roundNo}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{interview.statusName}</div>
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
            <div style={{ fontSize: 16 }}>📍 {interview.location}</div>
          </div>
        </div>

        {/* Interview Panel */}
        {interview.participants && interview.participants.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Interview Panel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interview.participants.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    backgroundColor: '#f9fafb',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.userName}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{p.interviewRole}</div>
                  </div>
                  {p.hasFeedback && (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      ✓ Submitted
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile */}
      {interview.candidate && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Candidate Profile</h2>
          
          {interview.candidate.summary && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Summary</div>
              <div style={{ color: '#4b5563' }}>{interview.candidate.summary}</div>
            </div>
          )}

          {interview.candidate.experiences && interview.candidate.experiences.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Experience</div>
              {interview.candidate.experiences.map((exp, idx) => (
                <div key={idx} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '2px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600 }}>{exp.jobTitle}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{exp.companyName}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                  </div>
                  {exp.description && <div style={{ fontSize: 14, marginTop: 4 }}>{exp.description}</div>}
                </div>
              ))}
            </div>
          )}

          {interview.candidate.educations && interview.candidate.educations.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Education</div>
              {interview.candidate.educations.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '2px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600 }}>{edu.degree}</div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{edu.schoolName}</div>
                  {edu.major && <div style={{ fontSize: 13, color: '#9ca3af' }}>{edu.major}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evaluation Form */}
      {canEvaluate && interview.evaluationCriteria && interview.evaluationCriteria.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          padding: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Submit Feedback</h2>

          {/* Evaluation Criteria */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Evaluation Scores</div>
            {interview.evaluationCriteria.map((criterion) => {
              const score = feedback.scores.find(s => s.criteriaId === criterion.id);
              return (
                <div key={criterion.id} style={{ marginBottom: 20, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{criterion.criteriaName}</div>
                    {criterion.description && (
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{criterion.description}</div>
                    )}
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      Max Score: {criterion.maxScore} | Weight: {criterion.weight}%
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, alignItems: 'start' }}>
                    <input
                      type="number"
                      min="0"
                      max={criterion.maxScore}
                      step="0.5"
                      value={score?.score || 0}
                      onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 14
                      }}
                      placeholder="Score"
                    />
                    <input
                      type="text"
                      value={score?.comment || ''}
                      onChange={(e) => handleScoreCommentChange(criterion.id, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 14
                      }}
                      placeholder="Optional comment..."
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Comment */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Overall Comment
            </label>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
              placeholder="Share your overall assessment..."
            />
          </div>

          {/* Decision */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Decision *
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setFeedback(prev => ({ ...prev, decision: 'PASS' }))}
                style={{
                  padding: '12px 24px',
                  backgroundColor: feedback.decision === 'PASS' ? '#10b981' : 'white',
                  color: feedback.decision === 'PASS' ? 'white' : '#111827',
                  border: '1px solid #d1d5db',
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
                  padding: '12px 24px',
                  backgroundColor: feedback.decision === 'REJECT' ? '#ef4444' : 'white',
                  color: feedback.decision === 'REJECT' ? 'white' : '#111827',
                  border: '1px solid #d1d5db',
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
              padding: '12px 32px',
              backgroundColor: feedback.decision ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: feedback.decision ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}

      {/* Already Submitted */}
      {interview.hasMyFeedback && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>
            ✓ Feedback Submitted
          </div>
          <div style={{ color: '#047857' }}>
            You have already submitted your feedback for this interview.
          </div>
        </div>
      )}

      {/* Not Ready for Evaluation */}
      {!canEvaluate && !interview.hasMyFeedback && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
            Interview Not Completed Yet
          </div>
          <div style={{ color: '#b45309' }}>
            You can submit feedback after the interview ends on {formatDateTime(interview.endTime)}
          </div>
        </div>
      )}
    </div>
  );
}
