import React, { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import { gsap } from 'gsap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';



ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();

  // keep hooks at the top
  const [dashboardData, setDashboardData] = useState({
    currentStatus: 'Clocked Out',
    todaysHours: 8.5,
    weeklyHours: 42.5,
    monthlyHours: 168.0,
    leaveBalance: { vacation: 15, sick: 8, personal: 3 },
    nextPayrollDate: '2025-11-15',
    currentPayPeriod: {
      start: '2025-10-16',
      end: '2025-10-31',
      grossPay: 2125.0,
      netPay: 1593.75,
      hoursWorked: 85,
    },
    recentActivities: [
      { date: '2025-11-12', activity: 'Clocked out at 5:30 PM', hours: 8.5 },
      { date: '2025-11-11', activity: 'Clocked out at 5:15 PM', hours: 8.0 },
      { date: '2025-11-10', activity: 'Clocked out at 5:45 PM', hours: 9.0 },
      { date: '2025-11-08', activity: 'Submitted expense report', hours: null },
      { date: '2025-11-07', activity: 'Clocked out at 5:20 PM', hours: 8.25 },
    ],
    upcomingPayrolls: [
      { date: '2025-11-15', amount: 1593.75, status: 'Pending' },
      { date: '2025-11-30', amount: 1593.75, status: 'Projected' },
    ],
    upcomingHolidays: [
      { date: '2025-12-25', name: 'Christmas Day' },
      { date: '2026-01-01', name: "New Year's Day" },
      { date: '2026-04-02', name: 'Good Friday' },
    ],
    // sample week history for chart comparison (last 4 weeks)
    weeklyHistory: [38.0, 40.5, 42.5, 42.5],
  });

  // working state (keeps existing functionality)
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // alert and confirm state preserved (if used elsewhere)
  const [alert, setAlert] = useState({ visible: false, message: '' });
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [elapsedPreview, setElapsedPreview] = useState(0);
  const alertTimerRef = useRef(null);

  // Time Off state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');



  useEffect(() => {
    let interval;
    if (isWorking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedMs = now - startTime;
        const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));
        setElapsedTime(elapsedHours);
      }, 1000); // Update every second
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [isWorking, startTime]);

  // prepare bar chart data: compare last 4 weeks vs 40hr target
  const labels = ['3 weeks ago', '2 weeks ago', 'Last week', 'This week'];
  const employeeHours = dashboardData.weeklyHistory.map((hours, index) =>
    index === 3 ? hours + (isWorking ? elapsedTime : 0) : hours
  );
  const targetHours = labels.map(() => 40);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Employee Hours',
        data: employeeHours,
        backgroundColor: 'rgba(30, 64, 175, 0.85)',
        borderRadius: 6,
      },
      {
        label: 'Target (40h)',
        data: targetHours,
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Weekly Work Hours (Last 4 Weeks)' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y} hrs`,
        },
      },
    },
    scales: {
      x: { stacked: false },
      y: {
        beginAtZero: true,
        suggestedMax: 50,
        title: { display: true, text: 'Hours' },
      },
    },
  };

  // basic start/stop handlers (same logic you already have)
  const performStop = (end = new Date()) => {
    const elapsedMs = end - (startTime || end);
    const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));
    setIsWorking(false);
    setStartTime(null);
    setDashboardData((prev) => {
      const newTodays = +(prev.todaysHours + elapsedHours).toFixed(2);
      const newActivities = [
        { date: end.toISOString().split('T')[0], activity: `Worked (manual stop)`, hours: +elapsedHours.toFixed(2) },
        ...prev.recentActivities,
      ].slice(0, 10);
      // also update latest week value (this week)
      const updatedHistory = [...prev.weeklyHistory];
      updatedHistory[3] = +(updatedHistory[3] + elapsedHours).toFixed(2);
      return {
        ...prev,
        currentStatus: 'Clocked Out',
        todaysHours: newTodays,
        recentActivities: newActivities,
        weeklyHistory: updatedHistory,
      };
    });
    setAlert({ visible: true, message: `You stopped work — ${elapsedHours.toFixed(2)} hrs recorded.` });
    setTimeout(() => setAlert({ visible: false, message: '' }), 3500);
  };

  const handleStartStop = () => {
    if (!isWorking) {
      setStartTime(new Date());
      setIsWorking(true);
      setDashboardData((prev) => ({ ...prev, currentStatus: 'Clocked In' }));
      setAlert({ visible: true, message: 'You have clocked in.' });
      setTimeout(() => setAlert({ visible: false, message: '' }), 2000);
      // GSAP animation for start work button
      gsap.to('.btn-primary', {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.to('.btn-primary', {
            boxShadow: '0 0 20px rgba(30,64,175,0.4)',
            duration: 0.3,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut'
          });
        }
      });
    } else {
      // confirmation before stopping (simplified confirm)
      const now = new Date();
      const previewMs = now - (startTime || now);
      const previewHours = Math.max(0, previewMs / (1000 * 60 * 60));
      setElapsedPreview(+previewHours.toFixed(2));
      setConfirmVisible(true);
      // GSAP animation for stop work button
      gsap.to('.btn-ghost', {
        scale: 0.95,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.to('.btn-ghost', {
            rotation: 5,
            duration: 0.1,
            yoyo: true,
            repeat: 5,
            ease: 'power2.inOut'
          });
        }
      });
    }
  };

  const confirmStop = () => {
    setConfirmVisible(false);
    performStop();
  };

  const cancelStop = () => {
    setConfirmVisible(false);
    setAlert({ visible: true, message: 'Clock-out cancelled.' });
    setTimeout(() => setAlert({ visible: false, message: '' }), 2000);
  };

  // Time Off handlers
  const handleReset = () => {
    setSelectedDate(null);
    setSelectedPolicy('');
    setSelectedStatus('');
  };

  const handleAddLeave = async () => {
    if (!selectedDate || !selectedPolicy) {
      setAlert({ visible: true, message: 'Please select a date and policy.' });
      setTimeout(() => setAlert({ visible: false, message: '' }), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('emp_token');
      if (!token) {
        setAlert({ visible: true, message: 'Please log in to submit leave requests.' });
        setTimeout(() => setAlert({ visible: false, message: '' }), 3000);
        return;
      }

      const response = await fetch('http://localhost:4000/api/employee/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate.format('YYYY-MM-DD'),
          policy: selectedPolicy,
          status: selectedStatus || 'Pending',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({ visible: true, message: 'Leave request submitted successfully.' });
        setTimeout(() => setAlert({ visible: false, message: '' }), 3000);
        // Reset after submission
        handleReset();
        // Optionally refresh dashboard data or leave requests
      } else {
        setAlert({ visible: true, message: data.message || 'Failed to submit leave request.' });
        setTimeout(() => setAlert({ visible: false, message: '' }), 3000);
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setAlert({ visible: true, message: 'Network error. Please try again.' });
      setTimeout(() => setAlert({ visible: false, message: '' }), 3000);
    }
  };



  // redirect if not logged in
  if (!user) return <Navigate to="/login" replace />;

  // if admin, show admin dashboard instead
  if (user.role === 'admin') return <AdminDashboard />;

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2>Welcome back, {user.name}</h2>
            <p className="muted">{user.position} — {user.department} • {user.employeeId}</p>
          </div>

          {/* start/stop button */}
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={handleStartStop}
              className={`btn ${isWorking ? 'btn-ghost' : 'btn-primary'}`}
              aria-pressed={isWorking}
              style={{ padding: '10px 16px', borderRadius: 10, minWidth: 140, fontWeight: 600 }}
            >
              {isWorking ? 'Stop Work' : 'Start Work'}
            </button>
          </div>
        </div>

        {/* transient alert */}
        {alert.visible && (
          <div role="alert" style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)' }}>
            {alert.message}
          </div>
        )}

        {/* Chart + summary */}
        <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: 320, minHeight: 260 }}>
            <div style={{ height: 220 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>This Week</h4>
                <p style={{ margin: 0 }}>{employeeHours[3].toFixed(2)} hrs</p>
                <p className="muted" style={{ marginTop: 6 }}>Target: 40 hrs</p>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>Today's Hours</h4>
                <p style={{ margin: 0 }}>{dashboardData.todaysHours} hrs</p>
                <p className="muted" style={{ marginTop: 6 }}>Monthly total: {dashboardData.monthlyHours} hrs</p>
              </div>
            </div>
          </div>

          {/* small summary cards */}
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card">
              <h4>Current Status</h4>
              <p>{dashboardData.currentStatus}</p>
              {isWorking && (
                <p className="muted" style={{ marginTop: 4 }}>
                  Running time: {elapsedTime.toFixed(2)} hrs
                </p>
              )}
            </div>

            <div className="card">
              <h4>Next Payroll</h4>
              <p>{dashboardData.nextPayrollDate}</p>
              <p className="muted">Net: ${dashboardData.currentPayPeriod.netPay.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <section style={{ marginTop: 20 }}>
          <h3>Recent Activities</h3>
          <ul>
            {dashboardData.recentActivities.map((a, idx) => (
              <li key={idx}>
                <strong>{a.date}:</strong> {a.activity} {a.hours != null ? `— ${a.hours} hrs` : ''}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Upcoming holidays card */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Upcoming Holidays</h3>
        <p className="muted" style={{ marginTop: 4 }}>Company-observed holidays and dates.</p>
        <ul style={{ marginTop: 8 }}>
          {dashboardData.upcomingHolidays.map((h, i) => (
            <li key={i} style={{ padding: '6px 0' }}>
              <strong>{h.date}</strong>: {h.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Time Off card */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Time Off</h3>
        <p className="muted" style={{ marginTop: 4 }}>Request leave by selecting a date and policy.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Select Leave Date"
              value={selectedDate}
              onChange={setSelectedDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Policy</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <label>
                  <input
                    type="radio"
                    name="policy"
                    value="Medical Leave"
                    checked={selectedPolicy === 'Medical Leave'}
                    onChange={(e) => setSelectedPolicy(e.target.value)}
                  />
                  Medical
                </label>
                <label>
                  <input
                    type="radio"
                    name="policy"
                    value="Vacation Leave"
                    checked={selectedPolicy === 'Vacation Leave'}
                    onChange={(e) => setSelectedPolicy(e.target.value)}
                  />
                  Vacation
                </label>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">Select</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <button onClick={handleAddLeave} className="btn btn-primary">
              Add
            </button>
            <button onClick={handleReset} className="btn btn-ghost">
              Reset
            </button>
          </div>
          {/* Leave requests are now stored in the database and visible in admin panel */}
        </div>
      </div>



      {/* Confirmation modal */}
      {confirmVisible && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(0,0,0,0.35)' }}>
          <div style={{ width: 360, background: 'var(--surface)', borderRadius: 12, padding: 20, border: '1px solid rgba(0,0,0,0.06)' }}>
            <h4 style={{ margin: 0 }}>Confirm clock-out</h4>
            <p className="muted" style={{ marginTop: 8 }}>
              You're about to stop work. This will record approximately <strong>{elapsedPreview} hrs</strong>.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => { setConfirmVisible(false); cancelStop(); }} className="btn btn-ghost" style={{ padding: '8px 12px' }}>Cancel</button>
              <button onClick={confirmStop} className="btn btn-primary" style={{ padding: '8px 12px' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
