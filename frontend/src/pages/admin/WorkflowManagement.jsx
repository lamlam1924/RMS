import { useState, useEffect } from 'react';
import { workflowService } from '../../services/adminService';
import { EditIcon, DeleteIcon } from '../../components/admin/ActionIcons';

export default function WorkflowManagement() {
  const [statusTypes, setStatusTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [editingTransition, setEditingTransition] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedType) {
      loadStatusesAndTransitions(selectedType.id);
    }
  }, [selectedType]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading workflow data...');
      console.log('Token:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
      console.log('User:', JSON.parse(localStorage.getItem('userInfo') || '{}'));
      
      const [typesData, rolesData] = await Promise.all([
        workflowService.getStatusTypes(),
        workflowService.getRoles()
      ]);
      console.log('Status Types:', typesData);
      console.log('Roles:', rolesData);
      setStatusTypes(typesData);
      setRoles(rolesData);
      if (typesData.length > 0) {
        setSelectedType(typesData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Check if it's 401 Unauthorized
      if (error.message.includes('401')) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }
      
      alert('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusesAndTransitions = async (typeId) => {
    setLoading(true);
    try {
      const [statusesData, transitionsData] = await Promise.all([
        workflowService.getStatusesByType(typeId),
        workflowService.getTransitionsByType(typeId)
      ]);
      setStatuses(statusesData);
      setTransitions(transitionsData);
    } catch (error) {
      alert('Failed to load statuses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransition = () => {
    setEditingTransition({
      statusTypeId: selectedType.id,
      fromStatusId: '',
      toStatusId: '',
      requiredRoleId: ''
    });
    setShowTransitionModal(true);
  };

  const handleEditTransition = (transition) => {
    setEditingTransition(transition);
    setShowTransitionModal(true);
  };

  const handleSaveTransition = async () => {
    try {
      if (editingTransition.id) {
        await workflowService.updateTransition(editingTransition.id, editingTransition);
      } else {
        await workflowService.createTransition(editingTransition);
      }
      setShowTransitionModal(false);
      setEditingTransition(null);
      loadStatusesAndTransitions(selectedType.id);
    } catch (error) {
      alert('Failed to save transition: ' + error.message);
    }
  };

  const handleDeleteTransition = async (id) => {
    if (!confirm('Are you sure you want to delete this transition?')) return;
    try {
      await workflowService.deleteTransition(id);
      loadStatusesAndTransitions(selectedType.id);
    } catch (error) {
      alert('Failed to delete transition: ' + error.message);
    }
  };

  if (loading && statusTypes.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8 }}>
          🔄 Workflow Management
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          Manage status workflows, transitions, and approval permissions
        </p>
      </div>

      {/* Status Type Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24, 
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: 0
      }}>
        {statusTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type)}
            style={{
              padding: '12px 24px',
              background: selectedType?.id === type.id ? '#667eea' : 'transparent',
              color: selectedType?.id === type.id ? 'white' : '#64748b',
              border: 'none',
              borderBottom: selectedType?.id === type.id ? '2px solid #667eea' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s'
            }}
          >
            {type.description}
          </button>
        ))}
      </div>

      {selectedType && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* Statuses List */}
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Statuses
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statuses.map(status => (
                <div
                  key={status.id}
                  style={{
                    padding: 12,
                    background: status.isFinal ? '#fef3c7' : '#f1f5f9',
                    border: '1px solid',
                    borderColor: status.isFinal ? '#fbbf24' : '#cbd5e1',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {status.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {status.code} {status.isFinal ? '(Final)' : ''}
                    </div>
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#667eea'
                  }}>
                    #{status.orderNo}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Transitions */}
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16 
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Workflow Transitions
              </h3>
              <button
                onClick={handleAddTransition}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                + Add Transition
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transitions.map(transition => {
                const fromStatus = statuses.find(s => s.id === transition.fromStatusId);
                const toStatus = statuses.find(s => s.id === transition.toStatusId);
                const role = roles.find(r => r.id === transition.requiredRoleId);

                return (
                  <div
                    key={transition.id}
                    style={{
                      padding: 16,
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div style={{
                        padding: '6px 12px',
                        background: '#dbeafe',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#1e40af'
                      }}>
                        {fromStatus?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 20, color: '#667eea' }}>→</div>
                      <div style={{
                        padding: '6px 12px',
                        background: '#dcfce7',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#15803d'
                      }}>
                        {toStatus?.name || 'Unknown'}
                      </div>
                      <div style={{
                        marginLeft: 'auto',
                        padding: '6px 12px',
                        background: '#fef3c7',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#92400e'
                      }}>
                        🔐 {role?.name || 'Unknown Role'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEditTransition(transition)}
                        style={{
                          padding: '6px 12px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <EditIcon /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransition(transition.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <DeleteIcon /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {transitions.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  No transitions defined. Click "Add Transition" to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transition Modal */}
      {showTransitionModal && editingTransition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 12,
            width: 500,
            maxWidth: '90%'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
              {editingTransition.id ? 'Edit Transition' : 'Add Transition'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                  From Status
                </label>
                <select
                  value={editingTransition.fromStatusId}
                  onChange={(e) => setEditingTransition({
                    ...editingTransition,
                    fromStatusId: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="">Select status...</option>
                  {statuses.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                  To Status
                </label>
                <select
                  value={editingTransition.toStatusId}
                  onChange={(e) => setEditingTransition({
                    ...editingTransition,
                    toStatusId: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="">Select status...</option>
                  {statuses.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                  Required Role
                </label>
                <select
                  value={editingTransition.requiredRoleId}
                  onChange={(e) => setEditingTransition({
                    ...editingTransition,
                    requiredRoleId: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="">Select role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={handleSaveTransition}
                disabled={!editingTransition.fromStatusId || !editingTransition.toStatusId || !editingTransition.requiredRoleId}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: (!editingTransition.fromStatusId || !editingTransition.toStatusId || !editingTransition.requiredRoleId) ? 0.5 : 1
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowTransitionModal(false);
                  setEditingTransition(null);
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#e5e7eb',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
