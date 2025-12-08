import React, { useState, useEffect } from 'react';
import {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getVehicles,
  getCustomers,
} from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import './Pages.css';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    pickup_location: '',
    return_location: '',
    total_amount: 0,
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsRes, vehiclesRes, customersRes] = await Promise.all([
        getBookings(),
        getVehicles(),
        getCustomers(),
      ]);
      setBookings(bookingsRes.data);
      setVehicles(vehiclesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'vehicle_id' || name === 'start_date' || name === 'end_date') {
      calculateTotalAmount({ ...formData, [name]: value });
    }
  };

  const calculateTotalAmount = (data) => {
    if (data.vehicle_id && data.start_date && data.end_date) {
      const vehicle = vehicles.find((v) => v.id === parseInt(data.vehicle_id));
      if (vehicle) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const total = days * vehicle.daily_rate;
        setFormData((prev) => ({ ...prev, total_amount: total }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBooking) {
        await updateBooking(editingBooking.id, formData);
      } else {
        await createBooking(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving booking');
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      customer_id: booking.customer_id,
      vehicle_id: booking.vehicle_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      pickup_location: booking.pickup_location,
      return_location: booking.return_location,
      total_amount: booking.total_amount,
      paid_amount: booking.paid_amount,
      status: booking.status,
      notes: booking.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteBooking(id);
        loadData();
      } catch (error) {
        alert('Error deleting booking');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      vehicle_id: '',
      start_date: '',
      end_date: '',
      pickup_location: '',
      return_location: '',
      total_amount: 0,
      status: 'pending',
      notes: '',
    });
    setEditingBooking(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      active: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-danger',
    };
    return `badge ${badges[status] || 'badge-secondary'}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Bookings</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus /> Add Booking
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Pickup Location</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{`${booking.first_name} ${booking.last_name}`}</td>
                  <td>
                    <div className="vehicle-info">
                      <FaCalendarAlt />
                      <span>{`${booking.brand} ${booking.model}`}</span>
                    </div>
                  </td>
                  <td>{new Date(booking.start_date).toLocaleDateString()}</td>
                  <td>{new Date(booking.end_date).toLocaleDateString()}</td>
                  <td>{booking.pickup_location}</td>
                  <td>
                    <div>
                      <div>{formatCurrency(booking.total_amount)}</div>
                      <small style={{ color: '#6b7280' }}>
                        Paid: {formatCurrency(booking.paid_amount || 0)}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadge(booking.status)}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(booking)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(booking.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
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
              <h2>{editingBooking ? 'Edit Booking' : 'Add New Booking'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Customer</label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {`${customer.first_name} ${customer.last_name}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehicle</label>
                  <select
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles
                      .filter((v) => v.status === 'available' || editingBooking)
                      .map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {`${vehicle.brand} ${vehicle.model} - $${vehicle.daily_rate}/day`}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Pickup Location</label>
                  <input
                    type="text"
                    name="pickup_location"
                    value={formData.pickup_location}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Return Location</label>
                  <input
                    type="text"
                    name="return_location"
                    value={formData.return_location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Total Amount ($)</label>
                  <input
                    type="number"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    step="0.01"
                    required
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBooking ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;
