// ==========================================
// Menu Page
// ==========================================
import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({ Name: '', Price: '', Category: '' });

  // Predefined categories
  const categories = ['Pizza', 'Main Course', 'Appetizer', 'Side', 'Beverage', 'Dessert', 'Seasonal'];

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  // Fetch all menu items
  const fetchMenu = () => {
    apiRequest('/menu')
      .then((data) => {
        setMenuItems(data);
        setLoading(false);
      })
      .catch((err) => {
        showMessage('error', err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add menu item
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    apiRequest('/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((data) => {
        showMessage('success', data.message);
        setForm({ Name: '', Price: '', Category: '' });
        fetchMenu();
      })
      .catch((err) => showMessage('error', err.message))
      .finally(() => setSubmitting(false));
  };

  // Delete menu item
  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete "${name}" from menu?`)) return;
    apiRequest(`/menu/${id}`, { method: 'DELETE' })
      .then(() => {
        showMessage('success', 'Menu item deleted!');
        fetchMenu();
      })
      .catch((err) => showMessage('error', err.message));
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Menu</h2>
        <p>Manage food and beverage items</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'}`} role="alert">
          {messageType === 'error' ? '❌' : '✅'} {message}
        </div>
      )}

      {/* Add Menu Item Form */}
      <div className="card mb-24">
        <h3 className="section-title">➕ Add Menu Item</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="menu-name">Item Name</label>
              <input
                id="menu-name"
                type="text"
                name="Name"
                value={form.Name}
                onChange={handleChange}
                placeholder="e.g. Caesar Salad"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="menu-price">Price ($)</label>
              <input
                id="menu-price"
                type="number"
                name="Price"
                value={form.Price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="menu-category">Category</label>
              <select id="menu-category" name="Category" value={form.Category} onChange={handleChange} required>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'end' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add to Menu'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Menu Items Table */}
      <div className="card">
        <h3 className="section-title">🍽️ Current Menu</h3>
        {loading ? (
          <div className="loading"><div className="spinner"></div>Loading...</div>
        ) : menuItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">🍽️</div>
            <p>No menu items yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.ItemID}>
                  <td>{item.ItemID}</td>
                  <td>{item.Name}</td>
                  <td><span className="badge reserved">{item.Category}</span></td>
                  <td>${Number(item.Price).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item.ItemID, item.Name)}
                      aria-label={`Delete ${item.Name}`}
                    >
                      Delete
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

export default MenuPage;
