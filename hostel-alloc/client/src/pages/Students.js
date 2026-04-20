import React, { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit3, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DEPTS = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Electronics', 'Chemical', 'Mathematics', 'Physics', 'Other'];
const INITIAL = { studentId: '', name: '', email: '', phone: '', department: 'Computer Science', year: 1, gender: 'Male', cgpa: 7.0, income: 300000, isPhysicallyDisabled: false, isLocalStudent: false, preferences: { roomType: 'Any', floor: 'Any' } };

const statusBadge = (s) => {
  const map = { Allocated: 'badge-green', Pending: 'badge-amber', Waitlisted: 'badge-purple', Rejected: 'badge-red' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const LIMIT = 15;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filterStatus) params.status = filterStatus;
      if (filterGender) params.gender = filterGender;
      const res = await studentsAPI.getAll(params);
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally { setLoading(false); }
  }, [page, filterStatus, filterGender]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openAdd = () => { setForm(INITIAL); setEditStudent(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ ...s, preferences: s.preferences || INITIAL.preferences }); setEditStudent(s); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditStudent(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('pref_')) {
      const key = name.replace('pref_', '');
      setForm(p => ({ ...p, preferences: { ...p.preferences, [key]: value } }));
    } else {
      setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editStudent) {
        await studentsAPI.update(editStudent._id, form);
        toast.success('Student updated');
      } else {
        await studentsAPI.create(form);
        toast.success('Student added');
      }
      closeModal();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try {
      await studentsAPI.delete(id);
      toast.success('Student removed');
      fetchStudents();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = search
    ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    : students;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} students registered</div>
        <button className="btn btn-primary" onClick={openAdd}><Plus />Add Student</button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <Search className="search-icon" />
          <input className="search-input" placeholder="Search by name, ID, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Allocated">Allocated</option>
          <option value="Waitlisted">Waitlisted</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterGender} onChange={e => { setFilterGender(e.target.value); setPage(1); }}>
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {(filterStatus || filterGender) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterGender(''); }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student ID</th><th>Name</th><th>Department</th><th>Year</th>
              <th>Gender</th><th>CGPA</th><th>Priority Score</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row"><td colSpan={9}>Loading students...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state"><Plus size={32} /><h3>No students found</h3><p>Add your first student to get started</p></div></td></tr>
            ) : filtered.map(s => (
              <tr key={s._id}>
                <td><code style={{ fontSize: 12, background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>{s.studentId}</code></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.email}</div>
                </td>
                <td style={{ fontSize: 13 }}>{s.department}</td>
                <td><span className="badge badge-blue">Y{s.year}</span></td>
                <td style={{ fontSize: 13 }}>{s.gender}</td>
                <td>
                  <div className="priority-bar">
                    <div className="priority-track" style={{ width: 50 }}>
                      <div className="priority-fill" style={{ width: `${(s.cgpa / 10) * 100}%`, background: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.cgpa}</span>
                  </div>
                </td>
                <td>
                  <div className="priority-bar">
                    <div className="priority-track" style={{ width: 50 }}>
                      <div className="priority-fill" style={{ width: `${Math.min((s.priority / 100) * 100, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.priority}</span>
                  </div>
                </td>
                <td>{statusBadge(s.allocationStatus)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Edit3 size={13} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id, s.name)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editStudent ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Student ID *</label>
                    <input className="form-input" name="studentId" value={form.studentId} onChange={handleChange} placeholder="CS2024001" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Aryan Sharma" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="aryan@college.edu" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select className="form-select" name="department" value={form.department} onChange={handleChange}>
                      {DEPTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year *</label>
                    <select className="form-select" name="year" value={form.year} onChange={handleChange}>
                      {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-select" name="gender" value={form.gender} onChange={handleChange}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">CGPA (0–10) *</label>
                    <input className="form-input" name="cgpa" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Annual Family Income (₹)</label>
                    <input className="form-input" name="income" type="number" value={form.income} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Preference</label>
                    <select className="form-select" name="pref_roomType" value={form.preferences?.roomType || 'Any'} onChange={handleChange}>
                      <option>Any</option><option>Single</option><option>Double</option><option>Triple</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: 20, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" name="isPhysicallyDisabled" checked={form.isPhysicallyDisabled} onChange={handleChange} />
                      Physically Disabled
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" name="isLocalStudent" checked={form.isLocalStudent} onChange={handleChange} />
                      Local Student
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editStudent ? 'Update' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
