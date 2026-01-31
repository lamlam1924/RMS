import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hrService from '../../../services/hrService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { StatusBadge } from '../../../components/shared/Badge';

export default function HROfferList() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'all'

  useEffect(() => {
    loadOffers();
  }, [filter]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = filter === 'pending'
        ? await hrService.offers.getPending()
        : await hrService.offers.getAll();
      setOffers(data);
    } catch (error) {
      console.error('Failed to load offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': { bg: '#f3f4f6', color: '#374151' },
      'IN_REVIEW': { bg: '#fef3c7', color: '#92400e' },
      'APPROVED': { bg: '#dcfce7', color: '#166534' },
      'SENT': { bg: '#dbeafe', color: '#1e40af' },
      'ACCEPTED': { bg: '#d1fae5', color: '#065f46' },
      'REJECTED': { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || { bg: '#f3f4f6', color: '#374151' };

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Job Offers
            </h1>
            <p style={{ color: '#6b7280' }}>
              Review and approve offers for candidates
            </p>
          </div>
          <button
            onClick={() => navigate('/staff/hr-manager/offers/create')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            + Create Offer
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setFilter('pending')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'pending' ? '#f59e0b' : 'white',
            color: filter === 'pending' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Pending Review ({offers.filter(o => o.currentStatus === 'IN_REVIEW').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: filter === 'all' ? '#3b82f6' : 'white',
            color: filter === 'all' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          All Offers
        </button>
      </div>

      {/* Offers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : offers.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: 40,
          textAlign: 'center',
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No offers found</div>
          <div style={{ color: '#6b7280', marginBottom: 16 }}>
            {filter === 'pending' ? 'No offers pending review' : 'No offers available'}
          </div>
          <button
            onClick={() => navigate('/staff/hr-manager/offers/create')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Create First Offer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {offers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => navigate(`/staff/hr-manager/offers/${offer.id}`)}
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 8,
                border: offer.currentStatus === 'IN_REVIEW' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Review Badge */}
              {offer.currentStatus === 'IN_REVIEW' && (
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 12
                }}>
                  ⏰ NEEDS REVIEW
                </div>
              )}

              {/* Offer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    {offer.candidateName}
                  </div>
                  <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500, marginBottom: 4 }}>
                    {offer.positionTitle}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {offer.departmentName}
                  </div>
                </div>
                <div>
                  {getStatusBadge(offer.currentStatus)}
                </div>
              </div>

              {/* Salary Info */}
              <div style={{
                padding: 16,
                backgroundColor: '#f0fdf4',
                borderRadius: 8,
                marginBottom: 12
              }}>
                <div style={{ fontSize: 12, color: '#166534', marginBottom: 4 }}>Offered Salary</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                  {formatCurrency(offer.salary)}
                </div>
              </div>

              {/* Offer Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16
              }}>
                {offer.startDate && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Start Date</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(offer.startDate)}</div>
                  </div>
                )}
                {offer.probationPeriod && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Probation Period</div>
                    <div style={{ fontWeight: 500 }}>{offer.probationPeriod} months</div>
                  </div>
                )}
                {offer.createdAt && (
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Created</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(offer.createdAt)}</div>
                  </div>
                )}
              </div>

              {/* Benefits */}
              {offer.benefits && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#374151'
                }}>
                  <span style={{ fontWeight: 600 }}>Benefits:</span> {offer.benefits}
                </div>
              )}

              {/* Action Indicators */}
              {offer.currentStatus === 'IN_REVIEW' && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  backgroundColor: '#fef3c7',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#92400e',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  ⚠️ Waiting for your review and approval
                </div>
              )}
              {offer.currentStatus === 'APPROVED' && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  backgroundColor: '#dcfce7',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#166534',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  ✓ Approved - Ready to send to candidate
                </div>
              )}
              {offer.currentStatus === 'SENT' && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  backgroundColor: '#dbeafe',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#1e40af',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  📧 Sent to candidate - Waiting for response
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
