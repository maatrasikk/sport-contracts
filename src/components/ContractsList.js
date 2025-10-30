import React, { useEffect } from 'react';
import { ref, update, get } from 'firebase/database';
import { db } from '../firebase';
import './ContractsList.css';

function ContractsList({ contracts, user, onOpenCalendar, onCreateContract }) {
  
  // Функция для обновления старых контрактов
  const updateOldContracts = async () => {
    try {
      const contractsRef = ref(db, 'contracts');
      const snapshot = await get(contractsRef);
      const contractsData = snapshot.val();

      if (contractsData) {
        const updatePromises = [];

        Object.keys(contractsData).forEach(contractId => {
          const contract = contractsData[contractId];
          
          // Если контракт принят, но participantName пустое
          if (contract.status === 'accepted' && 
              contract.participantId && 
              (!contract.participantName || contract.participantName === '')) {
            
            // Получаем данные пользователя из базы
            const userRef = ref(db, `users/${contract.participantId}`);
            get(userRef).then((userSnapshot) => {
              const userData = userSnapshot.val();
              if (userData) {
                updatePromises.push(
                  update(ref(db, `contracts/${contractId}`), {
                    participantName: userData.displayName || userData.email.split('@')[0]
                  })
                );
              }
            });
          }
        });

        // Ждем завершения всех обновлений
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log('Updated old contracts with participant names');
        }
      }
    } catch (error) {
      console.error('Error updating old contracts:', error);
    }
  };

  // Запускаем обновление при загрузке компонента
  useEffect(() => {
    updateOldContracts();
  }, []);

  const handleAcceptContract = async (contractId, contract) => {
    try {
      await update(ref(db, `contracts/${contractId}`), {
        status: 'accepted',
        participantId: user.uid,
        participantName: user.displayName || user.email.split('@')[0]
      });
    } catch (error) {
      console.error('Error accepting contract:', error);
    }
  };

  const handleDeclineContract = async (contractId) => {
    try {
      // Сразу помечаем как удаленный вместо declined
      await update(ref(db, `contracts/${contractId}`), {
        status: 'deleted'
      });
    } catch (error) {
      console.error('Error declining contract:', error);
    }
  };

  const handleDeleteRequest = async (contractId) => {
    try {
      await update(ref(db, `contracts/${contractId}`), {
        deleteRequestedBy: user.uid,
        deleteRequestedAt: Date.now()
      });
    } catch (error) {
      console.error('Error requesting deletion:', error);
    }
  };

  const handleConfirmDelete = async (contractId) => {
    try {
      await update(ref(db, `contracts/${contractId}`), {
        deleteConfirmedBy: user.uid,
        deleteConfirmedAt: Date.now(),
        status: 'deleted'
      });
    } catch (error) {
      console.error('Error confirming deletion:', error);
    }
  };

  const handleCancelDelete = async (contractId) => {
    try {
      await update(ref(db, `contracts/${contractId}`), {
        deleteRequestedBy: null,
        deleteRequestedAt: null
      });
    } catch (error) {
      console.error('Error canceling deletion:', error);
    }
  };

  const handleOpenCalendar = (contract) => {
    onOpenCalendar(contract);
  };

  // Функция для клика по карточке
  const handleCardClick = (contract, e) => {
    // Проверяем, что клик не по кнопке действий
    if (e.target.closest('.contract-actions')) {
      return;
    }
    
    // Открываем календарь только для принятых контрактов
    if (contract.status === 'accepted') {
      handleOpenCalendar(contract);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'declined': return 'Declined';
      case 'deleted': return 'Deleted';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'declined': return 'status-declined';
      default: return 'status-pending';
    }
  };

  // Проверяем, кто запросил удаление
  const getDeleteRequesterName = (contract) => {
    if (contract.deleteRequestedBy === contract.createdBy) {
      return contract.createdByName || 'Creator';
    } else {
      return contract.participantName || 'Participant';
    }
  };

  // Проверяем, может ли пользователь удалить контракт
  const canDeleteContract = (contract) => {
    return contract.status === 'accepted' && 
           contract.deleteRequestedBy && 
           contract.deleteRequestedBy !== user.uid;
  };

  // Проверяем, запросил ли пользователь удаление
  const hasUserRequestedDelete = (contract) => {
    return contract.deleteRequestedBy === user.uid;
  };

  // Функция для получения отображаемого имени участника
  const getDisplayName = (contract, field) => {
    if (field === 'creator') {
      if (contract.createdBy === user.uid) {
        return user.displayName || user.email;
      } else {
        // Для создателя всегда используем createdByName
        return contract.createdByName || 'Creator';
      }
    } else {
      if (contract.participantEmail === user.email) {
        return user.displayName || user.email;
      } else {
        // Для участника используем participantName, если есть, иначе часть email
        return contract.participantName || 
               (contract.participantEmail ? contract.participantEmail.split('@')[0] : 'Participant');
      }
    }
  };

  // Функция для отображения дней тренировок
  const renderTrainingDays = (contract) => {
    if (contract.schedule.type === 'specific') {
      const days = Object.keys(contract.schedule.days)
        .filter(day => contract.schedule.days[day])
        .map(day => 
          day === 'monday' ? 'Mon' :
          day === 'tuesday' ? 'Tue' :
          day === 'wednesday' ? 'Wed' :
          day === 'thursday' ? 'Thu' :
          day === 'friday' ? 'Fri' :
          day === 'saturday' ? 'Sat' : 'Sun'
        );

      return (
        <div className="training-days">
          {days.map(day => (
            <span key={day} className="day-tag">{day}</span>
          ))}
        </div>
      );
    } else {
      return (
        <span className="day-tag flexible-tag">
          {contract.schedule.daysPerWeek} days/week (flexible)
        </span>
      );
    }
  };

  if (contracts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <h3>No contracts yet</h3>
        <p>Create your first sport contract to get started!</p>
        <button 
          onClick={onCreateContract}
          className="action-btn action-btn-primary"
          style={{marginTop: '1rem'}}
        >
          ➕ Create Your First Contract
        </button>
      </div>
    );
  }

  return (
    <div className="contracts-list">
      {contracts.map(contract => (
        <div 
          key={contract.id} 
          className={`contract-card ${contract.status === 'pending' ? 'pending' : ''}`}
          onClick={(e) => handleCardClick(contract, e)}
        >
          {/* Баннер удаления */}
          {contract.deleteRequestedBy && contract.status !== 'deleted' && (
            <div className="delete-banner">
              <p className="delete-message">
                🗑️ <strong>{getDeleteRequesterName(contract)}</strong> wants to delete this contract
              </p>
              {canDeleteContract(contract) && (
                <div className="delete-actions">
                  <button 
                    onClick={() => handleConfirmDelete(contract.id)}
                    className="action-btn action-btn-danger"
                  >
                    ✅ Confirm Delete
                  </button>
                  <button 
                    onClick={() => handleCancelDelete(contract.id)}
                    className="action-btn action-btn-secondary"
                  >
                    ❌ Keep Contract
                  </button>
                </div>
              )}
              {hasUserRequestedDelete(contract) && (
                <div className="delete-actions">
                  <button 
                    onClick={() => handleCancelDelete(contract.id)}
                    className="action-btn action-btn-secondary"
                  >
                    ↩️ Cancel Delete Request
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="contract-header">
            <div className="contract-content">
              <h3 className="contract-title">{contract.title}</h3>
              <p className="contract-description">{contract.description}</p>
              
              <div className="contract-details">
                <div className="detail-item">
                  <span className="detail-label">👥 Participants:</span>
                  <div className="participants">
                    <span className="participant">{getDisplayName(contract, 'creator')}</span>
                    <span className="participant-arrow">→</span>
                    <span className="participant">{getDisplayName(contract, 'participant')}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">📅 Training:</span>
                  {renderTrainingDays(contract)}
                </div>

                <div className="detail-item">
                  <span className="detail-label">📊 Status:</span>
                  <span className={`status-badge ${getStatusClass(contract.status)}`}>
                    {getStatusText(contract.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="contract-actions">
              {contract.participantEmail === user.email && contract.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <button 
                    onClick={() => handleAcceptContract(contract.id, contract)}
                    className="action-btn action-btn-success"
                  >
                    ✅ Accept
                  </button>
                  <button 
                    onClick={() => handleDeclineContract(contract.id)}
                    className="action-btn action-btn-danger"
                  >
                    ❌ Decline
                  </button>
                </div>
              )}
              
              {contract.status === 'accepted' && !contract.deleteRequestedBy && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleOpenCalendar(contract)}
                    className="action-btn action-btn-primary"
                  >
                    📅 Open Calendar
                  </button>
                  <button 
                    onClick={() => handleDeleteRequest(contract.id)}
                    className="action-btn action-btn-outline"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContractsList;