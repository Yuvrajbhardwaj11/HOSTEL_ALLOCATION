import React, { useState, useEffect, useCallback } from 'react';
import { roomsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit3, X, Wifi, Wind, Bath, BookOpen } from 'lucide-react';

const AMENITY_ICONS = { AC: <Wind size={11} />, WiFi: <Wifi size={11} />, 'Attached Bathroom': <Bath size={11} />, 'Study Table': <BookOpen size={11} /> };
const AMENITIES = ['AC', 'WiFi', 'Attached Bathroom', 'Balcony', 'Study Table', 'Wardrobe', 'Fan'];
const INITIAL = { roomNumber: '', block: '', floor: 0, type: 'Double', capacity: 2, gender: 'Male', amenities: ['WiFi', 'Fan', 'Study Table'], monthlyRent: 3000, isAccessible: false };

const statusBadge = (s) => {
  const map = { Available: 'badge-green', Full: 'badge-red', Maintenance: 'badge-amber', Reserved: 'badge-purple' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterGender) params.gender = filterGender;
      if (filterType) params.type = filterType;
      const res = await roomsAPI.getAll(params);
      setRooms(res.data);
    } catch { toast.error('Failed to fetch rooms'); }
    finally { setLoading(false); }
  }, [filterStatus, filterGender, filterType]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const openAdd = () => { setForm(INITIAL); setEditRoom(null); setShowModal(true); };
  const openEdit = (r) => { setForm(r); setEditRoom(r); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditRoom(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value) }));
  };

  const toggleAmenity = (a) => {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editRoom) { await roomsAPI.update(editRoom._id, form); toast.success('Room updated'); }
      else { await roomsAPI.create(form); toast.success('Room created'); }
      closeModal(); fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, num) => {
    if (!window.confirm(`Delete Room ${num}?`)) return;
    try { await roomsAPI.delete(id); toast.success('Room deleted'); fetchRooms(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = search
    ? rooms.filter(r => r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.block.toLowerCase().includes(search.toLowerCase()))
    : rooms;

  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.currentOccupancy, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {rooms.length} rooms · {totalOccupied}/{totalCapacity} occupied
          {totalCapacity > 0 && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>({Math.round((totalOccupied / totalCapacity) * 100)}%)</span>}
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus />Add Room</button>
      </div>

      <div className="filters-bar">
        <div className="search-wrap">
          <Search className="search-icon" />
          <input className="search-input" placeholder="Search by room number or block..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Available</option><option>Full</option><option>Maintenance</option><option>Reserved</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
          <option value="">All Gender</option>
          <option>Male</option><option>Female</option><option>Mixed</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option>Single</option><option>Double</option><option>Triple</option>
        </select>
        {(filterStatus || filterGender || filterType) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterGender(''); setFilterType(''); }}><X size={13} /> Clear</button>
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Room No.</th><th>Block</th><th>Floor</th><th>Type</th>
              <th>Gender</th><th>Occupancy</th><th>Amenities</th><th>Rent/Month</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row"><td colSpan={10}>Loading rooms...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10}><div className="empty-state"><Plus size={32} /><h3>No rooms found</h3><p>Add rooms to the hostel</p></div></td></tr>
            ) : filtered.map(r => (
              <tr key={r._id}>
                <td><span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{r.roomNumber}</span></td>
                <td><span className="badge badge-blue">Block {r.block}</span></td>
                <td style={{ fontSize: 13 }}>Floor {r.floor}</td>
                <td><span className="badge badge-gray">{r.type}</span></td>
                <td style={{ fontSize: 13 }}>{r.gender}</td>
                <td>
                  <div className="priority-bar">
                    <div className="priority-track" style={{ width: 60 }}>
                      <div className="priority-fill" style={{ width: `${(r.currentOccupancy / r.capacity) * 100}%`, background: r.currentOccupancy >= r.capacity ? 'var(--red)' : 'var(--green)' }} />
                    </div>
                    <span style={{ fontSize: 12 }}>{r.currentOccupancy}/{r.capacity}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.amenities?.slice(0, 3).map(a => (
                      <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                        {AMENITY_ICONS[a]}{a}
                      </span>
                    ))}
                    {r.amenities?.length > 3 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{r.amenities.length - 3}</span>}
                  </div>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--green)' }}>₹{r.monthlyRent.toLocaleString()}</td>
                <td>{statusBadge(r.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Edit3 size={13} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id, r.roomNumber)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Room Number *</label>
                    <input className="form-input" name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="A-101" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Block *</label>
                    <input className="form-input" name="block" value={form.block} onChange={handleChange} placeholder="A" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input className="form-input" name="floor" type="number" min="0" max="10" value={form.floor} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Type *</label>
                    <select className="form-select" name="type" value={form.type} onChange={e => { handleChange(e); const cap = { Single: 1, Double: 2, Triple: 3 }; setForm(p => ({ ...p, type: e.target.value, capacity: cap[e.target.value] })); }}>
                      <option>Single</option><option>Double</option><option>Triple</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input className="form-input" name="capacity" type="number" min="1" max="4" value={form.capacity} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-select" name="gender" value={form.gender} onChange={handleChange}>
                      <option>Male</option><option>Female</option><option>Mixed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Rent (₹) *</label>
                    <input className="form-input" name="monthlyRent" type="number" value={form.monthlyRent} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={form.status || 'Available'} onChange={handleChange}>
                      <option>Available</option><option>Maintenance</option><option>Reserved</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Amenities</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {AMENITIES.map(a => (
                        <button type="button" key={a} onClick={() => toggleAmenity(a)}
                          style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${form.amenities?.includes(a) ? 'var(--accent)' : 'var(--border)'}`, background: form.amenities?.includes(a) ? 'var(--accent-dim)' : 'transparent', color: form.amenities?.includes(a) ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" name="isAccessible" checked={form.isAccessible} onChange={handleChange} />
                      Wheelchair Accessible Room
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editRoom ? 'Update Room' : 'Create Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
