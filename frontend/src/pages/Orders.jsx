// ==========================================
// Orders (Pre-Order) Page
// ==========================================
import { useState, useEffect } from 'react';
import { apiRequest } from '../api';

function Orders() {
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bill, setBill] = useState(null);
  const [selectedRes, setSelectedRes] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({ ResID: '', ItemID: '', Quantity: 1 });

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  };

  // Fetch reservations and menu on load
  useEffect(() => {
    apiRequest('/reservations')
      .then((data) => setReservations(data))
      .catch((err) => showMessage('error', err.message));

    apiRequest('/menu')
      .then((data) => setMenuItems(data))
      .catch((err) => showMessage('error', err.message));
  }, []);

  // Fetch orders for selected reservation
  const fetchOrders = (resId) => {
    if (!resId) return;
    setLoading(true);
    apiRequest(`/orders/${resId}`)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        showMessage('error', err.message);
        setLoading(false);
      });

    // Also fetch the bill
    apiRequest(`/reservations/${resId}/bill`)
      .then((data) => setBill(data))
      .catch((err) => showMessage('error', err.message));
  };

  // When selecting a reservation
  const handleSelectReservation = (resId) => {
    setSelectedRes(resId);
    setForm({ ...form, ResID: resId });
    if (resId) {
      fetchOrders(resId);
    } else {
      setOrders([]);
      setBill(null);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add pre-order
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    apiRequest('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then((data) => {
        showMessage('success', data.message);
        setForm({ ...form, ItemID: '', Quantity: 1 });
        fetchOrders(selectedRes);
      })
      .catch((err) => showMessage('error', err.message))
      .finally(() => setSubmitting(false));
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Pre-Orders</h2>
        <p>Add food items to reservations before arrival</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-success'}`} role="alert">
          {messageType === 'error' ? '❌' : '✅'} {message}
        </div>
      )}

      <div className="grid-2">
        {/* Add Pre-Order Form */}
        <div className="card">
          <h3 className="section-title">🛒 Add Pre-Order</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="order-res">Select Reservation</label>
              <select
                id="order-res"
                name="ResID"
                value={form.ResID}
                onChange={(e) => {
                  handleChange(e);
                  handleSelectReservation(e.target.value);
                }}
                required
              >
                <option value="">Choose a reservation</option>
                {reservations
                  .filter((r) => r.ReservationStatus !== 'Denied' && r.ReservationStatus !== 'Cancelled')
                  .map((r) => (
                    <option key={r.ResID} value={r.ResID}>
                      #{r.ResID} - {r.CustomerName} ({new Date(r.ReservationDate).toLocaleDateString()})
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="order-item">Menu Item</label>
              <select id="order-item" name="ItemID" value={form.ItemID} onChange={handleChange} required>
                <option value="">Choose an item</option>
                {menuItems.map((item) => (
                  <option key={item.ItemID} value={item.ItemID}>
                    {item.Name} - ${Number(item.Price).toFixed(2)} ({item.Category})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="order-qty">Quantity</label>
              <input
                id="order-qty"
                type="number"
                name="Quantity"
                value={form.Quantity}
                onChange={handleChange}
                min="1"
                max="20"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add to Pre-Order'}
            </button>
          </form>
        </div>

        {/* Bill Summary */}
        <div className="card">
          <h3 className="section-title">💰 Bill Summary</h3>
          {!selectedRes ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">📋</div>
              <p>Select a reservation to view the bill</p>
            </div>
          ) : bill && bill.ResID ? (
            <div className="bill-card">
              <div className="bill-row">
                <span>Reservation #</span>
                <span>{bill.ResID}</span>
              </div>
              <div className="bill-row">
                <span>Food Total</span>
                <span>${Number(bill.FoodTotal || 0).toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Zone Surcharge</span>
                <span>${Number(bill.SurchargeAmount || 0).toFixed(2)}</span>
              </div>
              <div className="bill-row total">
                <span>Grand Total</span>
                <span>${Number(bill.GrandTotal || 0).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">🛒</div>
              <p>No orders yet for this reservation</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items Table */}
      {selectedRes && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 className="section-title">📦 Order Items for Reservation #{selectedRes}</h3>
          {loading ? (
            <div className="loading"><div className="spinner"></div>Loading...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">🍽️</div>
              <p>No items ordered yet</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Order ID</th>
                  <th scope="col">Item</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.OrderID}>
                    <td>{o.OrderID}</td>
                    <td>{o.Name}</td>
                    <td><span className="badge reserved">{o.Category}</span></td>
                    <td>${Number(o.Price).toFixed(2)}</td>
                    <td>{o.Quantity}</td>
                    <td>${Number(o.Subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Orders;
