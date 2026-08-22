import React, { useState } from 'react';

export default function ExpenseModal({ isOpen, onClose, onAddExpense, stops = [] }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('transport');
  const [amount, setAmount] = useState('');
  const [tripStopId, setTripStopId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim() || !amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid expense label and positive amount.');
      return;
    }

    onAddExpense({
      label: label.trim(),
      category,
      amount: parseFloat(amount),
      tripStopId: tripStopId || null,
    });

    setLabel('');
    setAmount('');
    setCategory('transport');
    setTripStopId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-passive)', paddingBottom: '0.75rem' }}>
          <div>
            <h3>Add Trip Expense</h3>
            <p className="text-sm text-muted" style={{ margin: 0 }}>Record transport, stay, meals, or other costs</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Expense Description *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Flight to Narita, Shinkansen Pass, Hotel Booking"
              value={label}
              onChange={e => setLabel(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Category</label>
              <select
                className="input-field"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="transport">Transport (Flight / Train / Taxi)</option>
                <option value="stay">Stay (Hotel / Airbnb)</option>
                <option value="activities">Activities / Tickets</option>
                <option value="meals">Meals / Dining</option>
                <option value="other">Other / Misc</option>
              </select>
            </div>

            <div className="input-group">
              <label>Amount ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="e.g. 450.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {stops.length > 0 && (
            <div className="input-group">
              <label>Assign to Stop (Optional)</label>
              <select
                className="input-field"
                value={tripStopId}
                onChange={e => setTripStopId(e.target.value)}
              >
                <option value="">General Trip Level</option>
                {stops.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.cityName || 'Custom Leg'})</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Add Expense →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
