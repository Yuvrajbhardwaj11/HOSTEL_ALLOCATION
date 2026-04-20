import React, { useState, useEffect, useCallback } from 'react';
import { allocationsAPI, studentsAPI, roomsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Zap, X, Trash2, CheckCircle2, Clock, Users } from 'lucide-react';

export default function Allocations() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ studentId: '', roomId: '', academicYear: '2024-25', remarks: '' });
  const [saving, setSaving] = useState(false);
  const [autoResult, setAutoResult] = useState(null);
  const [running, setRunning] = useState(false);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await allocationsAPI.getAll({ status: 'Active' });
      setAllocations(res.data);
    } catch { toast.error('Failed to fetch allocations'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

  const openManual = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        studentsAPI.getAll({ status: 'Pending', limit: 200 }),
        roomsAPI.getAll({ status: 'Available' })
      ]);
      setStudents(sRes.data.students);
      setRooms(rRes.data);
      setForm({ studentId: '', roomId: '', academicYear: '2024-25', remarks: '' });
      setShowManualModal(true);
    } catch { toast.error('Failed to load data'); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.roomId) return toast.error('Select student and room');
    setSaving(true);
    try {
      await allocationsAPI.create(form);
      toast.success('Allocation created!');
      setShowManualModal(false);
      fetchAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate');
    } finally { setSaving(false); }
  };

  const handleAutoAllocate = async () => {
    setRunning(true);
    setAutoResult(null);
    try {
      const res = await allocationsAPI.autoAllocate({ academicYear: '2024-25' });
      setAutoResult(res.data);
      toast.success(`Allocated ${res.data.summary.allocated} students!`);
      fetchAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-allocation failed');
    } finally { setRunning(false); }
  };

  const handleVacate = async (id, studentName) => {
    if (!window.confirm(`Vacate allocation for ${studentName}?`)) return;
    try {
      await allocationsAPI.vacate(id);
      toast.success('Allocation vacated');
      fetchAllocations();
    } catch { toast.error('Failed to vacate'); }
  };

  const selectedStudent = students.find(s => s._id === form.studentId);
  const filteredRooms = selectedStudent
    ? rooms.filter(r => r.gender === 'Mixed' || r.gender === selectedStudent.gender)
    : rooms;

  return (
    <div>
      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{allocations.length} active allocations</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setShowAutoModal(true)}>
            <Zap size={15} style={{ color: 'var(--amber)' }} /> Auto Allocate
          </button>
          <button className="btn btn-primary" onClick={openManual}>
            <Plus /> Manual Allocation
          </button>
        </div>
      </div>

      {/* Allocations table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th><th>Department</th><th>Year</th>
              <th>Room</th><th>Block</th><th>Type</th><th>Rent</th>
              <th>Allocated On</th><th>Method</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row"><td colSpan={10}>Loading allocations...</td></tr>
            ) : allocations.length === 0 ? (
              <tr><td colSpan={10}>
                <div className="empty-state">
                  <Users size={36} />
                  <h3>No Active Allocations</h3>
                  <p>Use Auto Allocate or add manually</p>
                </div>
              </td></tr>
            ) : allocations.map(a => (
              <tr key={a._id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{a.student?.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.student?.studentId}</div>
                </td>
                <td style={{ fontSize: 13 }}>{a.student?.department}</td>
                <td><span className="badge badge-blue">Y{a.student?.year}</span></td>
                <td><span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                  {a.room?.roomNumber}
                </span></td>
                <td><span className="badge badge-gray">Block {a.room?.block}</span></td>
                <td style={{ fontSize: 13 }}>{a.room?.type}</td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>₹{a.room?.monthlyRent?.toLocaleString()}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.allocationDate).toLocaleDateString('en-IN')}</td>
                <td>
                  <span className={`badge ${a.allocationType === 'Auto' ? 'badge-purple' : 'badge-blue'}`}>
                    {a.allocationType === 'Auto' ? <><Zap size={10} /> Auto</> : 'Manual'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleVacate(a._id, a.student?.name)}>
                    <Trash2 size={12} /> Vacate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Allocation Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowManualModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Manual Allocation</h3>
              <button className="modal-close" onClick={() => setShowManualModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Select Student (Pending)</label>
                    <select className="form-select" value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value, roomId: '' }))} required>
                      <option value="">-- Choose Student --</option>
                      {students.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.studentId}) — {s.gender} · Priority: {s.priority}
                        </option>
                      ))}
                    </select>
                    {students.length === 0 && <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4 }}>No pending students</div>}
                  </div>

                  {selectedStudent && (
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Dept:</span> {selectedStudent.department}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Year:</span> {selectedStudent.year}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>CGPA:</span> {selectedStudent.cgpa}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Priority:</span> <strong style={{ color: 'var(--accent)' }}>{selectedStudent.priority}</strong></div>
                      {selectedStudent.isPhysicallyDisabled && <div style={{ color: 'var(--amber)', gridColumn: '1/-1' }}>⚠ Needs accessible room</div>}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Select Room (Available)</label>
                    <select className="form-select" value={form.roomId} onChange={e => setForm(p => ({ ...p, roomId: e.target.value }))} required>
                      <option value="">-- Choose Room --</option>
                      {filteredRooms.map(r => (
                        <option key={r._id} value={r._id}>
                          {r.roomNumber} · Block {r.block} · {r.type} · {r.gender} · {r.currentOccupancy}/{r.capacity} · ₹{r.monthlyRent}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input className="form-input" value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))} placeholder="2024-25" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Remarks (optional)</label>
                    <input className="form-input" value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Any special remarks..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowManualModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Allocating...' : 'Confirm Allocation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Allocate Modal */}
      {showAutoModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAutoModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} style={{ color: 'var(--amber)' }} /> Auto Allocate
              </h3>
              <button className="modal-close" onClick={() => setShowAutoModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16, marginBottom: 18, fontSize: 13 }}>
                <strong style={{ color: 'var(--amber)' }}>Priority-Based Algorithm</strong>
                <ul style={{ marginTop: 8, paddingLeft: 18, color: 'var(--text-secondary)', lineHeight: 2 }}>
                  <li>Students ranked by computed priority score</li>
                  <li>CGPA, disability, income, year, local status considered</li>
                  <li>Gender constraints automatically enforced</li>
                  <li>Accessible rooms given to disabled students</li>
                  <li>Rooms distributed evenly across blocks</li>
                  <li>Unmatched students marked as Waitlisted</li>
                </ul>
              </div>

              {autoResult && (
                <div className="alloc-result">
                  <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} /> Allocation Complete
                  </div>
                  <div className="alloc-result-row">
                    <span style={{ color: 'var(--text-muted)' }}>Allocated</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>{autoResult.summary.allocated} students</span>
                  </div>
                  <div className="alloc-result-row">
                    <span style={{ color: 'var(--text-muted)' }}>Waitlisted</span>
                    <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{autoResult.summary.waitlisted} students</span>
                  </div>
                  {autoResult.results?.allocated?.length > 0 && (
                    <div style={{ marginTop: 12, maxHeight: 160, overflowY: 'auto' }}>
                      {autoResult.results.allocated.slice(0, 10).map((a, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{a.name}</strong> → Room {a.room} (Block {a.block})
                        </div>
                      ))}
                      {autoResult.results.allocated.length > 10 && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>+{autoResult.results.allocated.length - 10} more...</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowAutoModal(false); setAutoResult(null); }}>
                {autoResult ? 'Close' : 'Cancel'}
              </button>
              {!autoResult && (
                <button className="btn btn-success" onClick={handleAutoAllocate} disabled={running}>
                  {running ? <><Clock size={14} /> Running...</> : <><Zap size={14} /> Run Auto Allocate</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
