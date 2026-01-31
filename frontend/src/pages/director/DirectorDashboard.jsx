import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import directorService from "../../services/directorService";

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingJobRequests: 0,
    pendingOffers: 0,
    totalJobRequests: 0,
    totalOffers: 0,
    urgentItems: 0,
  });
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const [jobRequests, offers] = await Promise.all([
        directorService.jobRequests.getPending(),
        directorService.offers.getPending(),
      ]);

      // Calculate statistics
      const urgentJobs = jobRequests.filter(jr => jr.priority === 1);
      const urgentOffers = offers.filter(o => o.priority === 1);

      // Group by department
      const deptMap = {};
      jobRequests.forEach(jr => {
        if (!deptMap[jr.departmentName]) {
          deptMap[jr.departmentName] = { 
            name: jr.departmentName, 
            pending: 0, 
            total: 0,
            budget: 0 
          };
        }
        deptMap[jr.departmentName].pending++;
        deptMap[jr.departmentName].total++;
        deptMap[jr.departmentName].budget += jr.budget || 0;
      });

      const deptBreakdown = Object.values(deptMap).sort((a, b) => b.pending - a.pending);

      // Get recent items (last 5)
      const recentItems = [
        ...jobRequests.slice(0, 3).map(jr => ({
          type: 'Job Request',
          title: jr.positionTitle,
          department: jr.departmentName,
          priority: jr.priority,
          createdAt: jr.createdAt,
          id: jr.id,
        })),
        ...offers.slice(0, 2).map(o => ({
          type: 'Offer',
          title: o.candidateName,
          department: o.departmentName,
          priority: o.priority,
          createdAt: o.createdAt,
          id: o.id,
        })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

      const urgent = [
        ...urgentJobs.map(jr => ({
          type: 'Job Request',
          title: jr.positionTitle,
          department: jr.departmentName,
          id: jr.id,
        })),
        ...urgentOffers.map(o => ({
          type: 'Offer',
          title: o.candidateName,
          department: o.departmentName,
          id: o.id,
        })),
      ];

      setStats({
        pendingJobRequests: jobRequests.length,
        pendingOffers: offers.length,
        totalJobRequests: jobRequests.length,
        totalOffers: offers.length,
        urgentItems: urgentJobs.length + urgentOffers.length,
      });
      setDepartmentBreakdown(deptBreakdown);
      setRecentActivity(recentItems);
      setUrgentRequests(urgent);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      1: { label: 'Urgent', color: '#ef4444', bg: '#fee2e2' },
      2: { label: 'High', color: '#f97316', bg: '#ffedd5' },
      3: { label: 'Normal', color: '#3b82f6', bg: '#dbeafe' },
    };
    const badge = badges[priority] || badges[3];
    return (
      <span style={{ 
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: badge.bg,
        color: badge.color
      }}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Director Dashboard</h1>
          <p style={styles.subtitle}>Strategic approval and oversight</p>
        </div>
        <div style={styles.quickActions}>
          <button 
            style={styles.quickActionBtn}
            onClick={() => navigate('/director/job-requests')}
          >
            📋 Job Requests
          </button>
          <button 
            style={styles.quickActionBtn}
            onClick={() => navigate('/director/offers')}
          >
            📄 Offers
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={{...styles.statCard, ...styles.statCardPrimary}}>
              <div style={styles.statIcon}>📋</div>
              <div style={styles.statContent}>
                <h3 style={styles.statLabel}>Pending Job Requests</h3>
                <p style={styles.statValue}>{stats.pendingJobRequests}</p>
                <p style={styles.statSubtext}>Awaiting your approval</p>
              </div>
            </div>

            <div style={{...styles.statCard, ...styles.statCardSuccess}}>
              <div style={styles.statIcon}>📄</div>
              <div style={styles.statContent}>
                <h3 style={styles.statLabel}>Pending Offers</h3>
                <p style={styles.statValue}>{stats.pendingOffers}</p>
                <p style={styles.statSubtext}>Final approval needed</p>
              </div>
            </div>

            <div style={{...styles.statCard, ...styles.statCardWarning}}>
              <div style={styles.statIcon}>🔥</div>
              <div style={styles.statContent}>
                <h3 style={styles.statLabel}>Urgent Items</h3>
                <p style={styles.statValue}>{stats.urgentItems}</p>
                <p style={styles.statSubtext}>High priority actions</p>
              </div>
            </div>

            <div style={{...styles.statCard, ...styles.statCardInfo}}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statContent}>
                <h3 style={styles.statLabel}>Total Pending</h3>
                <p style={styles.statValue}>{stats.totalJobRequests + stats.totalOffers}</p>
                <p style={styles.statSubtext}>All items to review</p>
              </div>
            </div>
          </div>

          {/* Urgent Requests Section */}
          {urgentRequests.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>🚨 Urgent Requests</h2>
                <span style={styles.badge}>{urgentRequests.length}</span>
              </div>
              <div style={styles.urgentList}>
                {urgentRequests.map((item, index) => (
                  <div 
                    key={index} 
                    style={styles.urgentItem}
                    onClick={() => navigate(
                      item.type === 'Job Request' 
                        ? `/director/job-requests/${item.id}`
                        : `/director/offers/${item.id}`
                    )}
                  >
                    <div style={styles.urgentIcon}>
                      {item.type === 'Job Request' ? '📋' : '📄'}
                    </div>
                    <div style={styles.urgentContent}>
                      <h4 style={styles.urgentTitle}>{item.title}</h4>
                      <p style={styles.urgentMeta}>
                        {item.type} • {item.department}
                      </p>
                    </div>
                    <div style={styles.urgentAction}>→</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.grid}>
            {/* Department Breakdown */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📊 Department Breakdown</h2>
              {departmentBreakdown.length > 0 ? (
                <div style={styles.departmentList}>
                  {departmentBreakdown.map((dept, index) => (
                    <div key={index} style={styles.departmentItem}>
                      <div style={styles.departmentHeader}>
                        <h4 style={styles.departmentName}>{dept.name}</h4>
                        <span style={styles.departmentCount}>{dept.pending} pending</span>
                      </div>
                      <div style={styles.departmentBar}>
                        <div 
                          style={{
                            ...styles.departmentBarFill,
                            width: `${(dept.pending / stats.pendingJobRequests * 100)}%`,
                          }}
                        />
                      </div>
                      <p style={styles.departmentBudget}>
                        Budget: {formatCurrency(dept.budget)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyState}>No pending requests by department</p>
              )}
            </div>

            {/* Recent Activity */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>⏰ Recent Activity</h2>
              {recentActivity.length > 0 ? (
                <div style={styles.activityList}>
                  {recentActivity.map((item, index) => (
                    <div 
                      key={index} 
                      style={styles.activityItem}
                      onClick={() => navigate(
                        item.type === 'Job Request' 
                          ? `/director/job-requests/${item.id}`
                          : `/director/offers/${item.id}`
                      )}
                    >
                      <div style={styles.activityTimeline}>
                        <div style={styles.activityDot} />
                        {index < recentActivity.length - 1 && (
                          <div style={styles.activityLine} />
                        )}
                      </div>
                      <div style={styles.activityContent}>
                        <div style={styles.activityHeader}>
                          <span style={styles.activityType}>{item.type}</span>
                          {getPriorityBadge(item.priority)}
                        </div>
                        <h4 style={styles.activityTitle}>{item.title}</h4>
                        <p style={styles.activityMeta}>
                          {item.department} • {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyState}>No recent activity</p>
              )}
            </div>
          </div>

          {/* Responsibilities Info */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Responsibilities</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h3 style={styles.infoCardTitle}>🎯 Recruitment Requests</h3>
                <p style={styles.infoCardText}>
                  Review and approve recruitment requests at the strategic level. Ensure alignment with company goals and budget.
                </p>
              </div>
              <div style={styles.infoCard}>
                <h3 style={styles.infoCardTitle}>💼 Job Offers</h3>
                <p style={styles.infoCardText}>
                  Final approval of job offers before sending to candidates. Review compensation and ensure fairness.
                </p>
              </div>
              <div style={styles.infoCard}>
                <h3 style={styles.infoCardTitle}>👥 Key Positions</h3>
                <p style={styles.infoCardText}>
                  Participate in interviews for strategic and senior positions to ensure quality hires.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
  },
  quickActions: {
    display: "flex",
    gap: "12px",
  },
  quickActionBtn: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
  },
  loading: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
    fontSize: "16px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
  },
  statCardPrimary: {
    borderLeft: "4px solid #3b82f6",
  },
  statCardSuccess: {
    borderLeft: "4px solid #10b981",
  },
  statCardWarning: {
    borderLeft: "4px solid #f59e0b",
  },
  statCardInfo: {
    borderLeft: "4px solid #8b5cf6",
  },
  statIcon: {
    fontSize: "40px",
    lineHeight: "1",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "4px",
    lineHeight: "1",
  },
  statSubtext: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
  },
  badge: {
    padding: "4px 12px",
    backgroundColor: "#fee2e2",
    color: "#ef4444",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
  },
  urgentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  urgentItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    border: "2px solid #fee2e2",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  urgentIcon: {
    fontSize: "28px",
  },
  urgentContent: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  urgentMeta: {
    fontSize: "13px",
    color: "#6b7280",
  },
  urgentAction: {
    fontSize: "20px",
    color: "#ef4444",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  departmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  departmentItem: {
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  departmentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  departmentName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
  },
  departmentCount: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
  },
  departmentBar: {
    height: "8px",
    backgroundColor: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  departmentBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    transition: "width 0.3s ease",
  },
  departmentBudget: {
    fontSize: "13px",
    color: "#6b7280",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  activityItem: {
    display: "flex",
    gap: "16px",
    padding: "16px 0",
    cursor: "pointer",
    transition: "background-color 0.2s",
    borderRadius: "8px",
  },
  activityTimeline: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  activityDot: {
    width: "12px",
    height: "12px",
    backgroundColor: "#3b82f6",
    borderRadius: "50%",
    border: "3px solid #dbeafe",
    zIndex: 1,
  },
  activityLine: {
    width: "2px",
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginTop: "4px",
  },
  activityContent: {
    flex: 1,
    paddingBottom: "8px",
  },
  activityHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },
  activityType: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  activityTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  activityMeta: {
    fontSize: "13px",
    color: "#6b7280",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#9ca3af",
    fontSize: "14px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  infoCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  },
  infoCardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },
  infoCardText: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
};

export default DirectorDashboard;
