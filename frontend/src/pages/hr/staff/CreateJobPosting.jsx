import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatCurrency } from '../../../utils/formatters/display';

export default function CreateJobPosting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobRequestId = searchParams.get('jobRequestId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobRequest, setJobRequest] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    salaryMin: '',
    salaryMax: '',
    location: '',
    deadline: ''
  });

  useEffect(() => {
    if (jobRequestId) {
      loadJobRequest();
    }
  }, [jobRequestId]);

  const loadJobRequest = async () => {
    try {
      setLoading(true);
      const data = await hrService.jobRequests.getById(jobRequestId);
      setJobRequest(data);
      
      // Pre-fill form
      setFormData({
        title: data.reason || `Hiring: ${data.positionTitle}`,
        description: data.reason || '',
        requirements: '', // Needs to be filled
        benefits: '', // Needs to be filled
        salaryMin: data.budget ? data.budget * 0.8 : '', // Suggestion
        salaryMax: data.budget || '',
        location: 'Head Office', // Default
        deadline: data.deadlineDate || ''
      });
    } catch (error) {
      console.error('Failed to load job request:', error);
      alert('Failed to load job request details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        jobRequestId: parseInt(jobRequestId),
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        salaryMin: parseFloat(formData.salaryMin),
        salaryMax: parseFloat(formData.salaryMax),
        location: formData.location,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      await hrService.jobPostings.create(payload);
      alert('Job posting created successfully!');
      navigate('/staff/hr-staff/job-postings');
    } catch (error) {
      console.error('Failed to create job posting:', error);
      alert('Failed to create job posting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!jobRequest) return <div style={{ padding: 24 }}>Job Request not found</div>;

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Create Job Posting</h1>
        
        <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Source Job Request</h3>
            <p><strong>Position:</strong> {jobRequest.positionTitle}</p>
            <p><strong>Department:</strong> {jobRequest.departmentName}</p>
            <p><strong>Quantity:</strong> {jobRequest.quantity}</p>
            <p><strong>Budget:</strong> {formatCurrency(jobRequest.budget)}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Job Title <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Salary Min</label>
                <input
                  type="number"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Salary Max</label>
                <input
                  type="number"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline ? formData.deadline.split('T')[0] : ''}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="- Bachelor degree in Computer Science..."
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Benefits</label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
                placeholder="- 13th month salary..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate('/staff/hr-staff/job-postings')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Creating...' : 'Create Draft'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
