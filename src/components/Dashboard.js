import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../firebase';
import CreateContract from './CreateContract';
import ContractsList from './ContractsList';
import ContractCalendar from './ContractCalendar';
import './Dashboard.css';

function Dashboard({ user }) {
  const [contracts, setContracts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user contracts
  useEffect(() => {
    const contractsRef = ref(db, 'contracts');
    
    const unsubscribe = onValue(contractsRef, (snapshot) => {
      const data = snapshot.val();
      const contractsList = [];
      
      if (data) {
        Object.keys(data).forEach(key => {
          const contract = data[key];
          contract.id = key;
          
          // Show contracts where user is creator or participant, EXCLUDING deleted AND declined
          if ((contract.createdBy === user.uid || contract.participantEmail === user.email) && 
              contract.status !== 'deleted' && 
              contract.status !== 'declined') {
            contractsList.push(contract);
          }
        });
      }
      
      setContracts(contractsList);
      setLoading(false);
    });

    return () => off(contractsRef, 'value', unsubscribe);
  }, [user.uid, user.email]);

  // If contract selected for calendar - show calendar
  if (selectedContract) {
    return (
      <ContractCalendar 
        contract={selectedContract} 
        user={user} 
        onBack={() => setSelectedContract(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your contracts...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>📋 My Contracts</h2>
          <p className="contracts-count">
            {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary create-contract-btn"
        >
          ➕ Create New Contract
        </button>
      </div>

      {showCreateForm && (
        <CreateContract 
          user={user} 
          onClose={() => setShowCreateForm(false)}
          onContractCreated={() => setShowCreateForm(false)}
        />
      )}

      <ContractsList 
        contracts={contracts} 
        user={user}
        onOpenCalendar={setSelectedContract}
        onCreateContract={() => setShowCreateForm(true)}
      />

      {contracts.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No contracts yet</h3>
          <p>Create your first sport contract to get started!</p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Your First Contract
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;