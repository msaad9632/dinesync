// ==========================================
// Customers Page
// ==========================================
import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');

  // Form state for adding a new customer
  const [form, setForm] = useState({ Name: '', Phone: '', Email: '' });

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  // Fetch all customers
  const fetchCustomers = () => {
    apiRequest('/customers')
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        showMessage('error', err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add a new customer
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    apiRequest('/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((data) => {
        showMessage('success', data.message);
        setForm({ Name: '', Phone: '', Email: '' });
        fetchCustomers(); // Refresh list
      })
      .catch((err) => showMessage('error', err.message))
      .finally(() => setSubmitting(false));
  };

  // Search customers by phone
  const handleSearch = () => {
    if (!searchPhone.trim()) {
      fetchCustomers();
      return;
    }
    apiRequest(`/customers/search?phone=${encodeURIComponent(searchPhone)}`)
      .then((data) => setCustomers(data))
      .catch((err) => showMessage('error', err.message));
  };

  // Delete a customer
  const handleDelete = (id) => {
    if (!window.confirm(`Delete customer #${id}? This cannot be undone.`)) return;
    apiRequest(`/customers/${id}`, { method: 'DELETE' })
      .then((data) => {
        showMessage('success', data.message);
        fetchCustomers(); // Refresh list
      })
      .catch((err) => showMessage('error', err.message));
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage your restaurant customers</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'}`} role="alert">
          {messageType === 'error' ? '❌' : '✅'} {message}
        </div>
      )}

      <div className="grid-2">
        {/* Add Customer Form */}
        <div className="card">
          <h3 className="section-title">➕ Add New Customer</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cust-name">Full Name</label>
              <input
                id="cust-name"
                type="text"
                name="Name"
                value={form.Name}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cust-phone">Phone Number</label>
              <input
                id="cust-phone"
                type="text"
                name="Phone"
                value={form.Phone}
                onChange={handleChange}
                placeholder="03001234567"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cust-email">Email Address</label>
              <input
                id="cust-email"
                type="email"
                name="Email"
                value={form.Email}
                onChange={handleChange}
                placeholder="customer@email.com"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Customer'}
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="card">
          <h3 className="section-title">🔍 Search by Phone</h3>
          <div className="form-group">
            <label htmlFor="cust-search">Phone Number</label>
            <input
              id="cust-search"
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter phone number to search"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleSearch}>Search</button>
            <button className="btn btn-outline" onClick={() => { setSearchPhone(''); fetchCustomers(); }}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="section-title">📋 All Customers</h3>
        {loading ? (
          <div className="loading"><div className="spinner"></div>Loading...</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">👥</div>
            <p>No customers found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Phone</th>
                <th scope="col">Email</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.CustomerID}>
                  <td>{c.CustomerID}</td>
                  <td>{c.Name}</td>
                  <td>{c.Phone}</td>
                  <td>{c.Email}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDelete(c.CustomerID)}
                      aria-label={`Remove customer ${c.Name}`}
                    >
                      🗑️ Remove
                    </button>
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

export default Customers;
