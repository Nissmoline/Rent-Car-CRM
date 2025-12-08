import React, { useState, useEffect } from 'react';
import { getPayments, createPayment, getBookings } from '../services/api';
import { FaPlus, FaDollarSign } from 'react-icons/fa';
import './Pages.css';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    booking_id: '',
    amount: 0,
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, bookingsRes] = await Promise.all([
        getPayments(),
        getBookings(),
      ]);
      setPayments(paymentsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPayment(formData);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error recording payment');
    }
  };

  const resetForm = () => {
    setFormData({
      booking_id: '',
      amount: 0,
      payment_method: 'cash',
      transaction_id: '',
      notes: '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTotalRevenue = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Payments</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus /> Record Payment
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Total Payments</h3>
            <p className="stat-number">{payments.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">{formatCurrency(getTotalRevenue())}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.payment_date).toLocaleString()}</td>
                  <td>{`${payment.first_name} ${payment.last_name}`}</td>
                  <td>{`${payment.brand} ${payment.model}`}</td>
                  <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                  <td>
                    <span className="payment-method">
                      {payment.payment_method}
                    </span>
                  </td>
                  <td>{payment.transaction_id || '-'}</td>
                  <td>
                    <span className="badge badge-success">
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Booking</label>
                <select
                  name="booking_id"
                  value={formData.booking_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Booking</option>
                  {bookings
                    .filter((b) => b.status !== 'cancelled')
                    .map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {`${booking.first_name} ${booking.last_name} - ${booking.brand} ${booking.model} - ${formatCurrency(
                          booking.total_amount - (booking.paid_amount || 0)
                        )} due`}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Transaction ID (Optional)</label>
                <input
                  type="text"
                  name="transaction_id"
                  value={formData.transaction_id}
                  onChange={handleChange}
                  placeholder="Enter transaction ID if applicable"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
