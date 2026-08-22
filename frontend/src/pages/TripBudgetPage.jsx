import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ExpenseModal from '../components/modals/ExpenseModal';

export default function TripBudgetPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [budgetData, setBudgetData] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  useEffect(() => {
    if (tripId) {
      loadBudgetAndStops();
    } else {
      resolveDefaultTrip();
    }
  }, [tripId]);

  const resolveDefaultTrip = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips?pageSize=1&sort=createdAt:desc');
      if (res.data && res.data.length > 0) {
        navigate(`/trips/${res.data[0].id}/budget`, { replace: true });
      } else {
        setError('No trips found. Please plan a trip first.');
        setLoading(false);
      }
    } catch (err) {
      setError('Please select a trip to view budget.');
      setLoading(false);
    }
  };

  const loadBudgetAndStops = async () => {
    try {
      setLoading(true);
      setError(null);
      const [budgetRes, stopsRes] = await Promise.all([
        api.get(`/trips/${tripId}/budget`),
        api.get(`/trips/${tripId}/stops`),
      ]);

      if (budgetRes.data) {
        setBudgetData(budgetRes.data);
      }
      if (stopsRes.data) {
        setStops(stopsRes.data);
      }
    } catch (err) {
      console.error('Error loading budget details:', err);
      setError('Failed to calculate budget. The trip may not exist or has been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expensePayload) => {
    try {
      await api.post(`/trips/${tripId}/expenses`, expensePayload);
      loadBudgetAndStops();
    } catch (err) {
      console.error('Error adding expense:', err);
      alert(err.message || 'Failed to add expense.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense line item?')) return;
    try {
      setDeletingExpenseId(expenseId);
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      loadBudgetAndStops();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense.');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary-dark)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
        <div>Calculating Budget & Cost Breakdown...</div>
      </div>
    );
  }

  if (error || !budgetData) {
    return (
      <div className="shell-container" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '0.5rem' }}>💰</div>
        <h3>Budget Not Available</h3>
        <p className="text-muted text-sm" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
          {error || 'Could not load budget data.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/trips" className="btn btn-secondary">
            Back to My Trips
          </Link>
          <Link to="/trips/new" className="btn btn-primary">
            + Plan a New Trip
          </Link>
        </div>
      </div>
    );
  }

  const { tripName, totalBudget, totalEstimatedCost, breakdown, averageCostPerDay, totalDays, overBudgetDays = [], expenses = [] } = budgetData;

  const actualPercentage = totalBudget ? Math.round((totalEstimatedCost / totalBudget) * 100) : null;
  const budgetProgress = totalBudget ? Math.min(100, actualPercentage) : null;
  const isOverBudget = totalBudget && totalEstimatedCost > totalBudget;

  const categoryIcons = {
    transport: '✈️',
    stay: '🏨',
    activities: '🎟️',
    meals: '🍽️',
    other: '🏷️',
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem 1.75rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <span className="shell-badge hub">Budget Analysis</span>
            <h2 style={{ margin: '0.25rem 0' }}>{tripName} — Cost Breakdown</h2>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              Live aggregation of scheduled activities and custom expenses across {totalDays} {totalDays === 1 ? 'day' : 'days'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsExpenseModalOpen(true)}
            >
              + Add Expense
            </button>
            <Link to={`/trips/${tripId}/itinerary`} className="btn btn-secondary btn-sm">
              ← Itinerary View
            </Link>
          </div>
        </div>

        {/* Budget Comparison Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
            <div className="text-sm text-muted" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', fontWeight: '600' }}>
              Total Estimated Cost
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: isOverBudget ? '#dc2626' : 'var(--accent-green)', marginTop: '0.25rem' }}>
              ${totalEstimatedCost.toFixed(2)}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
            <div className="text-sm text-muted" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', fontWeight: '600' }}>
              Target Budget
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '0.25rem', color: 'var(--text-charcoal)' }}>
              {totalBudget ? `$${parseFloat(totalBudget).toFixed(2)}` : 'Not set'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-passive)' }}>
            <div className="text-sm text-muted" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', fontWeight: '600' }}>
              Average Cost / Day
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '0.25rem', color: 'var(--text-charcoal)' }}>
              ${averageCostPerDay.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Budget Bar Meter */}
        {totalBudget && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.4rem', fontWeight: '600' }}>
              <span>Budget Consumption</span>
              <span style={{ color: isOverBudget ? '#dc2626' : 'var(--accent-green)' }}>
                {actualPercentage}% {isOverBudget && '(⚠️ Exceeds target budget)'}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(28,28,28,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${budgetProgress}%`,
                  height: '100%',
                  backgroundColor: isOverBudget ? '#dc2626' : 'var(--accent-green)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Over Budget Day Alerts */}
      {overBudgetDays.length > 0 && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', color: '#dc2626' }}>
          <strong>⚠️ Over-Budget Day Alert:</strong> Activities scheduled on <strong>{overBudgetDays.join(', ')}</strong> exceed your daily budget allowance!
        </div>
      )}

      {/* Category Breakdown Cards */}
      <h3 style={{ marginBottom: '1rem' }}>Category Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {Object.entries(breakdown).map(([category, amount]) => {
          const percent = totalEstimatedCost > 0 ? Math.round((amount / totalEstimatedCost) * 100) : 0;
          return (
            <div
              key={category}
              style={{
                backgroundColor: '#ffffff',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-passive)',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '0.35rem' }}>
                {categoryIcons[category] || '🏷️'}
              </div>
              <div style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '14px', color: 'var(--text-charcoal)' }}>
                {category}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', margin: '0.25rem 0', color: 'var(--text-primary)' }}>
                ${amount.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {percent}% of total
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Expenses Table */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem 1.75rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.2rem 0' }}>Custom Expense Line Items ({expenses.length})</h3>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              Log flights, hotels, meals, transport, and other travel costs
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsExpenseModalOpen(true)}
          >
            + Add Expense
          </button>
        </div>

        {expenses.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-passive)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Description</th>
                  <th style={{ padding: '0.75rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const isDeleting = deletingExpenseId === exp.id;
                  return (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-passive)', opacity: isDeleting ? 0.5 : 1 }}>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="nav-badge" style={{ textTransform: 'capitalize' }}>
                          {categoryIcons[exp.category]} {exp.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: '500', color: 'var(--text-charcoal)' }}>{exp.label}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                        ${exp.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          disabled={isDeleting}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#dc2626', padding: '4px 8px' }}
                        >
                          {isDeleting ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-page)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No custom expenses recorded yet. Click "+ Add Expense" to record flights, hotels, or meal estimates.
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAddExpense={handleAddExpense}
        stops={stops}
      />
    </div>
  );
}
