import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-calendar';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../firebase';
import 'react-calendar/dist/Calendar.css';
import './ContractCalendar.css';

function ContractCalendar({ contract, user, onBack }) {
  const [workouts, setWorkouts] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Определяем кто второй участник с правильными именами
  const getOtherUser = () => {
    if (user.uid === contract.createdBy) {
      return {
        id: contract.participantId,
        email: contract.participantEmail,
        name: contract.participantName || contract.participantEmail.split('@')[0],
        displayName: 'Friend'
      };
    } else {
      return {
        id: contract.createdBy,
        email: contract.createdByName, 
        name: contract.createdByName || user.displayName || user.email.split('@')[0],
        displayName: 'Friend'
      };
    }
  };

  const otherUser = getOtherUser();

  // Загружаем тренировки для этого договора
  useEffect(() => {
    const workoutsRef = ref(db, 'workouts');
    
    const unsubscribe = onValue(workoutsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const contractWorkouts = {};
      
      // Фильтруем тренировки только для этого договора
      Object.keys(data).forEach(key => {
        const workout = data[key];
        if (workout.contractId === contract.id) {
          const dateStr = workout.date;
          
          if (!contractWorkouts[dateStr]) {
            contractWorkouts[dateStr] = {
              userCompleted: false,
              otherCompleted: false
            };
          }
          
          // Определяем кто выполнил тренировку
          if (workout.userId === user.uid) {
            contractWorkouts[dateStr].userCompleted = true;
          } else if (workout.userId === otherUser.id) {
            contractWorkouts[dateStr].otherCompleted = true;
          }
        }
      });
      
      setWorkouts(contractWorkouts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [contract.id, user.uid, otherUser.id]);

  const toggleWorkout = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const workoutId = `${contract.id}_${user.uid}_${dateStr}`;
    const workoutRef = ref(db, `workouts/${workoutId}`);

    try {
      const currentWorkout = workouts[dateStr];
      const hasUserWorkout = currentWorkout?.userCompleted;

      if (hasUserWorkout) {
        await remove(workoutRef);
      } else {
        await set(workoutRef, {
          contractId: contract.id,
          userId: user.uid,
          date: dateStr,
          completed: true,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';

    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    const isScheduled = contract.schedule.type === 'specific' 
      ? contract.schedule.days[dayName]
      : true;
    
    const workout = workouts[dateStr];
    
    if (workout) {
      const userCompleted = workout.userCompleted;
      const otherCompleted = workout.otherCompleted;
      
      if (userCompleted && otherCompleted) {
        return 'both-completed';
      } else if (userCompleted) {
        return 'user-completed';
      } else if (otherCompleted) {
        return 'other-completed';
      }
    }
    
    const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
    if (isScheduled && isCurrentMonth) {
      return 'scheduled-workout';
    }
    
    return '';
  };

  // Статистика
  const scheduledDays = contract.schedule.type === 'specific' 
    ? Object.keys(contract.schedule.days).filter(day => contract.schedule.days[day]).length
    : contract.schedule.daysPerWeek;
  
  const userCompletedWorkouts = Object.values(workouts).filter(workout => workout.userCompleted).length;
  const otherCompletedWorkouts = Object.values(workouts).filter(workout => workout.otherCompleted).length;
  const bothCompletedWorkouts = Object.values(workouts).filter(workout => workout.userCompleted && workout.otherCompleted).length;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedWorkout = workouts[selectedDateStr];
  const hasUserWorkout = selectedWorkout?.userCompleted;
  const hasOtherWorkout = selectedWorkout?.otherCompleted;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button 
          onClick={onBack}
          className="calendar-back-btn"
        >
          ← Back to Contracts
        </button>
        <h1 className="calendar-title">{contract.title}</h1>
        <div style={{ width: '140px' }}></div> {/* Для выравнивания */}
      </div>

      {/* Информация о договоре */}
      <div className="contract-info">
        <h3>Contract Participants</h3>
        <div className="participant-list">
          <div className="participant-item">
            <span className="participant-emoji">👤</span>
            <div>
              <div className="participant-name">You: {user.displayName || user.email}</div>
            </div>
          </div>
          <div className="participant-item">
            <span className="participant-emoji">👤</span>
            <div>
              <div className="participant-name">{otherUser.displayName}: {otherUser.name}</div>
              <div className="participant-email">{otherUser.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="stats-grid">
        <div className="stat-card stat-you">
          <span className="stat-value">{userCompletedWorkouts}</span>
          <div className="stat-label">Your Workouts</div>
        </div>
        <div className="stat-card stat-friend">
          <span className="stat-value">{otherCompletedWorkouts}</span>
          <div className="stat-label">{otherUser.name}</div>
        </div>
        <div className="stat-card stat-together">
          <span className="stat-value">{bothCompletedWorkouts}</span>
          <div className="stat-label">Together</div>
        </div>
        <div className="stat-card stat-scheduled">
          <span className="stat-value">{scheduledDays}</span>
          <div className="stat-label">Scheduled/week</div>
        </div>
      </div>

      {/* Календарь */}
      <div className="calendar-wrapper">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={tileClassName}
          locale="en-US"
        />
        
        <div className="selected-date-info">
          <div className="selected-date-header">
            Selected Date: {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          <div className="workout-status">
            <div className="status-item">
              <span className="status-name">You:</span>
              <span className={`status-indicator ${hasUserWorkout ? 'status-completed' : 'status-not-completed'}`}>
                {hasUserWorkout ? '✅ Completed' : '❌ Not completed'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-name">{otherUser.name}:</span>
              <span className={`status-indicator ${hasOtherWorkout ? 'status-completed' : 'status-not-completed'}`}>
                {hasOtherWorkout ? '✅ Completed' : '❌ Not completed'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={toggleWorkout}
            className={`toggle-workout-btn ${hasUserWorkout ? 'cancel' : ''}`}
          >
            {hasUserWorkout ? '❌ Cancel Workout' : '✅ Mark Workout'}
          </button>
          
          {hasOtherWorkout && !hasUserWorkout && (
            <div className="motivation-message">
              💪 {otherUser.name} already completed the workout! Your turn!
            </div>
          )}
        </div>
      </div>

      {/* Легенда */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color legend-both"></div>
          <span>Both completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-you"></div>
          <span>You completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-friend"></div>
          <span>{otherUser.name} completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-scheduled"></div>
          <span>Scheduled day</span>
        </div>
      </div>
    </div>
  );
}

export default ContractCalendar;