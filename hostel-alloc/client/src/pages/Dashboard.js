import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../utils/api';
import { Users, DoorOpen, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#4f8ef7', '#10d980', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.value}</p>)}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><AlertCircle size={40} /><h3>Could not load stats</h3></div>;

  const { students, rooms, deptBreakdown, roomOccupancy, recentAllocations } = stats;

  const allocationPieData = [
    { name: 'Allocated', value: students.allocated },
    { name: 'Pending', value: students.pending },
    { name: 'Waitlisted', value: students.waitlisted },
  ].filter(d => d.value > 0);

  const occupancyData = roomOccupancy.map(r => ({
    block: `Block ${r._id}`,
    capacity: r.totalCapacity,
    occupied: r.totalOccupancy,
  }));

  const deptData = deptBreakdown.slice(0, 7).map(d => ({ name: d._id?.split(' ')[0], count: d.count }));

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-dim)' }}>
            <Users style={{ color: 'var(--accent)' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{students.total}</div>
            <div className="stat-label">Total Students</div>
            <div className="stat-sub">{students.male}M · {students.female}F</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-dim)' }}>
            <CheckCircle style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{students.allocated}</div>
            <div className="stat-label">Allocated</div>
            <div className="stat-sub">{students.total ? Math.round(students.allocated / students.total * 100) : 0}% of total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--amber-dim)' }}>
            <Clock style={{ color: 'var(--amber)' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{students.pending}</div>
            <div className="stat-label">Pending</div>
            <div className="stat-sub">{students.waitlisted} waitlisted</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--purple-dim)' }}>
            <DoorOpen style={{ color: 'var(--purple)' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: 'var(--purple)' }}>{rooms.total}</div>
            <div className="stat-label">Total Rooms</div>
            <div className="stat-sub">{rooms.available} available · {rooms.full} full</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>
            <TrendingUp style={{ color: '#06b6d4' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#06b6d4' }}>
              {rooms.total ? Math.round((rooms.full / rooms.total) * 100) : 0}%
            </div>
            <div className="stat-label">Occupancy Rate</div>
            <div className="stat-sub">{rooms.maintenance} under maintenance</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Room Occupancy by Block</span></div>
          {occupancyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={occupancyData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="block" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="capacity" fill="var(--border-light)" name="Capacity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="occupied" fill="var(--accent)" name="Occupied" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No room data yet</p></div>}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Allocation Status</span></div>
          {allocationPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={allocationPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {allocationPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No allocation data yet</p></div>}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Students by Department</span></div>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--green)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No student data yet</p></div>}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Recent Allocations</span></div>
          {recentAllocations?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentAllocations.map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                    {a.student?.name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.student?.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.student?.department}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>Room {a.room?.roomNumber}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Block {a.room?.block}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state" style={{ padding: 30 }}><p>No recent allocations</p></div>}
        </div>
      </div>
    </div>
  );
}
