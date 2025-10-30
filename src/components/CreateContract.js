import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { db } from '../firebase';
import './Modal.css';

function CreateContract({ user, onClose, onContractCreated }) {
  const [participantEmail, setParticipantEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState('specific');
  const [specificSchedule, setSpecificSchedule] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSpecificScheduleChange = (day) => {
    setSpecificSchedule(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let scheduleData = {};

    if (scheduleType === 'specific') {
      const selectedDays = Object.values(specificSchedule).filter(day => day);
      if (selectedDays.length === 0) {
        setError('Please select at least one training day');
        setLoading(false);
        return;
      }
      scheduleData = {
        type: 'specific',
        days: specificSchedule,
        selectedDays: selectedDays.length
      };
    } else {
      if (daysPerWeek < 1 || daysPerWeek > 7) {
        setError('Please select between 1 and 7 days per week');
        setLoading(false);
        return;
      }
      scheduleData = {
        type: 'flexible',
        daysPerWeek: daysPerWeek
      };
    }

    try {
      const newContractRef = push(ref(db, 'contracts'));
      
      await set(newContractRef, {
        title: title,
        description: description,
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        participantEmail: participantEmail,
        participantName: '',
        participantId: '',
        status: 'pending',
        schedule: scheduleData,
        createdAt: Date.now(),
        deleteRequestedBy: null,
        deleteRequestedAt: null
      });

      onContractCreated();
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">📝</span>
          <h2 className="modal-title">Create New Contract</h2>
          <p className="modal-subtitle">
            Set up a training agreement with your friend
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon">👤</span>
              Participant's Email
            </label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              required
              className="form-input"
            />
            <div className="form-help">
              Enter the email of the person you want to train with
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon">🏷️</span>
              Contract Title
            </label>
            <input
              type="text"
              placeholder="Morning Jogging, Swimming, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon">📋</span>
              Contract Description
            </label>
            <textarea
              placeholder="Describe your training goals and expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="form-label-icon">📅</span>
              Schedule Type
            </label>
            <div className="radio-group">
              <label className={`radio-option ${scheduleType === 'specific' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="scheduleType"
                  value="specific"
                  checked={scheduleType === 'specific'}
                  onChange={(e) => setScheduleType(e.target.value)}
                />
                <span className="radio-label">Specific Days</span>
              </label>
              <label className={`radio-option ${scheduleType === 'flexible' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="scheduleType"
                  value="flexible"
                  checked={scheduleType === 'flexible'}
                  onChange={(e) => setScheduleType(e.target.value)}
                />
                <span className="radio-label">Flexible Days</span>
              </label>
            </div>

            {scheduleType === 'specific' && (
              <div>
                <label className="form-label" style={{marginBottom: '0.75rem'}}>
                  Select Training Days
                </label>
                <div className="checkbox-group">
                  {Object.keys(specificSchedule).map(day => (
                    <label 
                      key={day} 
                      className={`checkbox-option ${specificSchedule[day] ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={specificSchedule[day]}
                        onChange={() => handleSpecificScheduleChange(day)}
                        style={{display: 'none'}}
                      />
                      {dayNames[day]}
                    </label>
                  ))}
                </div>
                <div className="form-help">
                  Choose the specific days for your training sessions
                </div>
              </div>
            )}

            {scheduleType === 'flexible' && (
              <div>
                <label className="form-label">
                  Days Per Week
                </label>
                <div className="range-container">
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                    className="range-slider"
                  />
                  <span className="range-value">{daysPerWeek}</span>
                  <span>day{daysPerWeek !== 1 ? 's' : ''}</span>
                </div>
                <div className="form-help">
                  Choose any {daysPerWeek} day{daysPerWeek !== 1 ? 's' : ''} per week that work for you
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="form-error">
              ⚠️ {error}
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
              disabled={loading}
              className="modal-btn modal-btn-primary"
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Create Contract
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateContract;