// ==========================================
// Tables Page
// ==========================================
import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

function Tables() {
  const [tables, setTables] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  // Form state for adding a new table
  const [form, setForm] = useState({ ZoneID: '', Capacity: '', Status: 'Available' });

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  // Fetch tables based on filter
  const fetchTables = (filterType) => {
    const path = filterType === 'available' ? '/tables/available' : '/tables';

    apiRequest(path)
      .then((data) => {
        setTables(data);
        setLoading(false);
      })
      .catch((err) => {
        showMessage('error', err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTables(filter);

    // Fetch zones for the dropdown
    apiRequest('/zones')
      .then((data) => setZones(data))
      .catch((err) => showMessage('error', err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Handle form changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add a new table
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    apiRequest('/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((data) => {
        showMessage('success', data.message);
        setForm({ ZoneID: '', Capacity: '', Status: 'Available' });
        fetchTables(filter);
      })
      .catch((err) => showMessage('error', err.message))
      .finally(() => setSubmitting(false));
  };

  // Update table status
  const updateTableStatus = (id, newStatus) => {
    apiRequest(`/tables/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Status: newStatus }),
    })
      .then((data) => {
        showMessage('success', data.message);
        fetchTables(filter);
      })
      .catch((err) => showMessage('error', err.message));
  };

  // Get badge class based on status
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'available';
      case 'reserved': return 'reserved';
      case 'maintenance': return 'maintenance';
      default: return '';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Restaurant Tables</h2>
        <p>View and manage tables, zones, and availability</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'}`} role="alert">
          {messageType === 'error' ? '❌' : '✅'} {message}
        </div>
      )}

      {/* Add Table Form */}
      <div className="card mb-24">
        <h3 className="section-title">➕ Add New Table</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="table-zone">Zone</label>
              <select id="table-zone" name="ZoneID" value={form.ZoneID} onChange={handleChange} required>
                <option value="">Select a zone</option>
                {zones.map((z) => (
                  <option key={z.ZoneID} value={z.ZoneID}>
                    {z.ZoneName} (+${Number(z.SurchargeAmount).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="table-capacity">Capacity (seats)</label>
              <input
                id="table-capacity"
                type="number"
                name="Capacity"
                value={form.Capacity}
                onChange={handleChange}
                placeholder="e.g. 4"
                min="1"
                max="20"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="table-status">Status</label>
              <select id="table-status" name="Status" value={form.Status} onChange={handleChange}>
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Table'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter Buttons */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
        >
          All Tables
        </button>
        <button
          className={`btn ${filter === 'available' ? 'btn-success' : 'btn-outline'}`}
          onClick={() => setFilter('available')}
        >
          Available Only
        </button>
      </div>

      {/* Tables List */}
      <div className="card">
        <h3 className="section-title">🪑 Tables Overview</h3>
        {loading ? (
          <div className="loading"><div className="spinner"></div>Loading...</div>
        ) : tables.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">🪑</div>
            <p>No tables found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Table #</th>
                <th scope="col">Zone</th>
                <th scope="col">Capacity</th>
                <th scope="col">Surcharge</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.TableID}>
                  <td>Table {t.TableID}</td>
                  <td>{t.ZoneName || 'N/A'}</td>
                  <td>{t.Capacity} seats</td>
                  <td>${Number(t.SurchargeAmount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${getStatusClass(t.Status)}`}>
                      {t.Status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {t.Status === 'Available' && (
                        <button className="btn btn-warning btn-sm" onClick={() => updateTableStatus(t.TableID, 'Maintenance')}>
                          🔧 Maintenance
                        </button>
                      )}
                      {t.Status === 'Maintenance' && (
                        <button className="btn btn-success btn-sm" onClick={() => updateTableStatus(t.TableID, 'Available')}>
                          ✅ Available
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

export default Tables;
