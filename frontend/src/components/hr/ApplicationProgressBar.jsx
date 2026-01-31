import React from 'react';

const ApplicationProgressBar = ({ statusId, daysInCurrentStatus }) => {
  const stages = [
    { id: 9, label: 'Applied', color: '#06b6d4' },
    { id: 10, label: 'Screening', color: '#f59e0b' },
    { id: 11, label: 'Interviewing', color: '#8b5cf6' },
    { id: 12, label: 'Passed', color: '#10b981' }
  ];

  const currentStageIndex = stages.findIndex(s => s.id === statusId);
  
  // Color coding cho days warning
  const getDaysColor = () => {
    if (daysInCurrentStatus > 14) return '#ef4444'; // Red
    if (daysInCurrentStatus > 7) return '#f59e0b';  // Amber
    return '#6b7280'; // Gray
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '12px 0',
      gap: 8
    }}>
      {/* Progress stages */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            {/* Circle indicator */}
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: index <= currentStageIndex ? stage.color : '#e5e7eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 600,
              flexShrink: 0,
              position: 'relative'
            }}>
              {index < currentStageIndex ? '✓' : index === currentStageIndex ? '●' : ''}
            </div>
            
            {/* Line connector */}
            {index < stages.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: index < currentStageIndex ? stage.color : '#e5e7eb',
                margin: '0 4px',
                minWidth: 20
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Days indicator */}
      <div style={{
        fontSize: 11,
        color: getDaysColor(),
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 12,
        backgroundColor: `${getDaysColor()}15`,
        flexShrink: 0
      }}>
        {daysInCurrentStatus}d
      </div>
    </div>
  );
};

export default ApplicationProgressBar;
