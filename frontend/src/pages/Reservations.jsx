// ==========================================
// Reservations Page
// ==========================================
import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    CustomerID: '',
    TableID: '',
    ReservationDate: '',
    StartTime: '',
    EndTime: '',
  });

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  // Fetch all data
  const fetchReservations = () => {
    apiRequest('/reservations')
      .then((data) => {
        setReservations(data);
        setLoading(false);
      })
      .catch((err) => {
        showMessage('error', err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReservations();

    // Fetch customers for dropdown
    apiRequest('/customers')
      .then((data) => setCustomers(data))
      .catch((err) => showMessage('error', err.message));

    // Fetch available tables for dropdown
    apiRequest('/tables/available')
      .then((data) => setTables(data))
      .catch((err) => showMessage('error', err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create reservation
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    apiRequest('/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((data) => {
        showMessage('success', data.message);
        setForm({ CustomerID: '', TableID: '', ReservationDate: '', StartTime: '', EndTime: '' });
        fetchReservations();
      })
      .catch((err) => showMessage('error', err.message))
      .finally(() => setSubmitting(false));
  };

  // Update reservation status
  const updateStatus = (id, newStatus) => {
    apiRequest(`/reservations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ReservationStatus: newStatus }),
    })
      .then(() => fetchReservations())
      .catch((err) => showMessage('error', err.message));
  };

  // Get badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'denied': return 'denied';
      case 'cancelled': return 'cancelled';
      case 'fulfilled': return 'fulfilled';
      default: return '';
    }
  };

  // Format time for display. The driver may return TIME columns as a
  // ISO datetime string like "1970-01-01T18:00:00.000Z" (what the mssql
  // driver actually serializes TIME columns as over JSON), or a plain
  // "HH:MM[:SS]" string.
  const formatTime = (time) => {
    if (!time) return '';
    let hours, mins;
    if (typeof time === 'string' && time.includes('T')) {
      const d = new Date(time);
      hours = d.getUTCHours();
      mins = String(d.getUTCMinutes()).padStart(2, '0');
    } else {
      const parts = String(time).split(':');
      hours = parseInt(parts[0], 10);
      mins = parts[1];
    }
    if (Number.isNaN(hours)) return String(time);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins} ${ampm}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Reservations</h2>
        <p>Create and manage table reservations</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'}`} role="alert">
          {messageType === 'error' ? '❌' : '✅'} {message}
        </div>
      )}

      {/* Create Reservation Form */}
      <div className="card mb-24">
        <h3 className="section-title">📅 New Reservation</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="res-customer">Customer</label>
              <select id="res-customer" name="CustomerID" value={form.CustomerID} onChange={handleChange} required>
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.CustomerID} value={c.CustomerID}>
                    {c.Name} ({c.Phone})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="res-table">Table</label>
              <select id="res-table" name="TableID" value={form.TableID} onChange={handleChange} required>
                <option value="">Select a table</option>
                {tables.map((t) => (
                  <option key={t.TableID} value={t.TableID}>
                    Table {t.TableID} - {t.ZoneName} ({t.Capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="res-date">Date</label>
              <input id="res-date" type="date" name="ReservationDate" value={form.ReservationDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="res-start">Start Time</label>
              <input id="res-start" type="time" name="StartTime" value={form.StartTime} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="res-end">End Time</label>
              <input id="res-end" type="time" name="EndTime" value={form.EndTime} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Reservation'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Reservations Table */}
      <div className="card">
        <h3 className="section-title">📋 All Reservations</h3>
        {loading ? (
          <div className="loading"><div className="spinner"></div>Loading...</div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">📅</div>
            <p>No reservations yet</p>
          </div>
        ) : (
          <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Table</th>
                  <th scope="col">Zone</th>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col">Status</th>
                  <th scope="col">Pre-Order</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.ResID}>
                    <td>{r.ResID}</td>
                    <td>{r.CustomerName}</td>
                    <td>Table {r.TableID}</td>
                    <td>{r.ZoneName}</td>
                    <td>{new Date(r.ReservationDate).toLocaleDateString()}</td>
                    <td>{formatTime(r.StartTime)} - {formatTime(r.EndTime)}</td>
                    <td>
                      <span className={`badge ${getStatusClass(r.ReservationStatus)}`}>
                        {r.ReservationStatus}
                      </span>
                    </td>
                    <td>{r.PreOrderState}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {r.ReservationStatus === 'Pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(r.ResID, 'Confirmed')}>
                              Confirm
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r.ResID, 'Denied')}>
                              Deny
                            </button>
                          </>
                        )}
                        {(r.ReservationStatus === 'Pending' || r.ReservationStatus === 'Confirmed') && (
                          <button className="btn btn-warning btn-sm" onClick={() => updateStatus(r.ResID, 'Cancelled')}>
                            Cancel
                          </button>
                        )}
                        {r.ReservationStatus === 'Confirmed' && (
                          <button className="btn btn-info btn-sm" onClick={() => updateStatus(r.ResID, 'Fulfilled')}>
                            ✅ Fulfilled
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Reservations;
