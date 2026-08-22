import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import ExpenseModal from '../components/modals/ExpenseModal';

export default function TripBudgetPage() {
  const { tripId } = useParams();

  const [budgetData, setBudgetData] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    if (tripId) {
      loadBudgetAndStops();
    }
  }, [tripId]);

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
      setError('Failed to calculate budget.');
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
    if (!window.confirm('Delete this expense line item?')) return;
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
      loadBudgetAndStops();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Calculating Budget & Cost Breakdown...
      </div>
    );
  }

  if (error || !budgetData) {
    return (
      <div className="shell-container" style={{ padding: '2rem' }}>
        <h3>Budget Not Available</h3>
        <p className="text-muted text-sm">{error || 'Could not load budget data.'}</p>
        <Link to={`/trips/${tripId}/itinerary`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Itinerary
        </Link>
      </div>
    );
  }

  const { tripName, totalBudget, totalEstimatedCost, breakdown, averageCostPerDay, totalDays, overBudgetDays = [], expenses = [] } = budgetData;

  const budgetProgress = totalBudget ? Math.min(100, Math.round((totalEstimatedCost / totalBudget) * 100)) : null;
  const isOverBudget = totalBudget && totalEstimatedCost > totalBudget;

  const categoryIcons = {
    transport: '✈️',
    stay: '🏨',
    activities: '🎟️',
    meals: '🍽️',
    other: '🏷️',
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-passive)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span className="shell-badge hub">Budget Analysis</span>
            <h2 style={{ margin: '0.25rem 0' }}>{tripName} — Cost Breakdown</h2>
            <p className="text-sm text-muted" style={{ margin: 0 }}>
              Live aggregation of scheduled activities and custom expenses across {totalDays} days
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsExpenseModalOpen(true)}
            >
              + Add Expense
            </button>
            <Link to={`/trips/${tripId}/itinerary`} className="btn btn-ghost btn-sm">
              ← Itinerary View
            </Link>
          </div>
        </div>

        {/* Budget Comparison Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
            <div className="text-sm text-muted" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              Total Estimated Cost
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: isOverBudget ? '#dc2626' : 'var(--accent-green)', marginTop: '0.25rem' }}>
              ${totalEstimatedCost.toFixed(2)}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
            <div className="text-sm text-muted" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              Target Budget
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '0.25rem' }}>
              {totalBudget ? `$${totalBudget.toFixed(2)}` : 'Not set'}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-passive)' }}>
            <div className="text-sm text-muted" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              Average Cost / Day
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '0.25rem' }}>
              ${averageCostPerDay.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Budget Bar Meter */}
        {totalBudget && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '0.4rem', fontWeight: '600' }}>
              <span>Budget Consumption</span>
              <span>{budgetProgress}% {isOverBudget && '(Exceeds target budget)'}</span>
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
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#dc2626' }}>
          <strong>⚠️ Over-Budget Day Alert:</strong> Costs scheduled on {overBudgetDays.join(', ')} exceed the daily target allocation!
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
                borderRadius: '10px',
                border: '1px solid var(--border-passive)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '0.25rem' }}>
                {categoryIcons[category] || '🏷️'}
              </div>
              <div style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '14px' }}>
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
      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-passive)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Custom Expense Line Items ({expenses.length})</h3>
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
                {expenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-passive)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="nav-badge" style={{ textTransform: 'capitalize' }}>
                        {categoryIcons[exp.category]} {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{exp.label}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#dc2626', padding: '4px 8px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted" style={{ margin: '1rem 0 0', textAlign: 'center' }}>
            No custom expenses recorded yet. Click "+ Add Expense" to record flights, hotels, or meal estimates.
          </p>
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
