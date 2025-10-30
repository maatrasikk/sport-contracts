import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { ref, update, get } from 'firebase/database';
import { auth, db } from '../firebase';
import './Modal.css';

function ProfileSettings({ user, onClose }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (displayName === user.displayName) {
      onClose();
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });

      await update(ref(db, 'users/' + user.uid), {
        displayName: displayName,
        updatedAt: Date.now()
      });

      // Обновляем имя во всех контрактах
      const contractsRef = ref(db, 'contracts');
      const snapshot = await get(contractsRef);
      const contractsData = snapshot.val();

      if (contractsData) {
        const updatePromises = [];

        Object.keys(contractsData).forEach(contractId => {
          const contract = contractsData[contractId];
          
          if (contract.createdBy === user.uid) {
            updatePromises.push(
              update(ref(db, `contracts/${contractId}`), {
                createdByName: displayName
              })
            );
          }
          
          if (contract.participantId === user.uid) {
            updatePromises.push(
              update(ref(db, `contracts/${contractId}`), {
                participantName: displayName
              })
            );
          }
        });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }

      setSuccess('Profile updated successfully! All contracts updated!');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">👤</span>
          <h2 className="modal-title">Edit Profile</h2>
          <p className="modal-subtitle">
            Update your display name across all contracts
          </p>
        </div>
        
        <form onSubmit={handleSave} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon"></span>
              Display Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="form-input"
            />
            <div className="form-help">
              This name will be shown to your friends in all contracts
            </div>
          </div>

          {error && (
            <div className="form-error">
              ⚠️ {error}
            </div>
          )}
          
          {success && (
            <div style={{
              background: 'rgba(72, 187, 120, 0.1)',
              border: '1px solid rgba(72, 187, 120, 0.2)',
              color: '#38a169',
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              ✅ {success}
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="modal-btn modal-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !displayName.trim()}
              className="modal-btn modal-btn-primary"
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettings;