import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Box,
  Button,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  TextField,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../context/constants';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sendingPayslip, setSendingPayslip] = useState(false);
  const [sendingAllPayslips, setSendingAllPayslips] = useState(false);
  const [downloadingPayslips, setDownloadingPayslips] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [addingBonus, setAddingBonus] = useState(false);
  const [bonusMessage, setBonusMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`);
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
      else console.error('fetch users error', data);
    } catch (err) {
      console.error('fetch users error', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openUser = async (id) => {
    setSelected(id);
    setDetails(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`);
      const data = await res.json();
      if (res.ok) setDetails(data);
      else setDetails({ error: data.message || 'Failed to load' });
    } catch (err) {
      console.error(err);
      setDetails({ error: 'Network error' });
    }
  };

  const sendPayslip = async (id) => {
    setSendingPayslip(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/send-payslip`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        alert('Payslip sent successfully to employee email!');
      } else {
        alert('Failed to send payslip: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while sending payslip');
    } finally {
      setSendingPayslip(false);
    }
  };

  const sendAllPayslips = async () => {
    if (!confirm(`Send payslips to all ${users.length} employees?`)) return;

    setSendingAllPayslips(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/send-all-payslips`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert('Failed to send bulk payslips: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while sending bulk payslips');
    } finally {
      setSendingAllPayslips(false);
    }
  };

  const downloadAllPayslips = async () => {
    setDownloadingPayslips(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/download-all-payslips`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslips-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download payslips PDF');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while downloading payslips');
    } finally {
      setDownloadingPayslips(false);
    }
  };

  const addBonusToAll = async () => {
    if (!bonusAmount || isNaN(bonusAmount) || bonusAmount <= 0) {
      setBonusMessage('Please enter a valid bonus amount.');
      return;
    }

    setAddingBonus(true);
    setBonusMessage('');
    try {
      const res = await fetch(`${API_URL}/api/admin/add-bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bonusAmount: parseFloat(bonusAmount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setBonusMessage(data.message);
        setBonusAmount('');
        fetchUsers(); // Refresh the user list to show updated bonuses
      } else {
        setBonusMessage(data.message || 'Failed to add bonus.');
      }
    } catch (err) {
      console.error(err);
      setBonusMessage('Network error while adding bonus.');
    } finally {
      setAddingBonus(false);
    }
  };

  const handleApproveLeave = async (userId, leaveIndex) => {
    if (!confirm('Are you sure you want to approve this leave?')) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/leaves/${leaveIndex}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy: user.name }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Leave approved successfully');
        openUser(userId); // Refresh the user details
      } else {
        alert('Failed to approve leave: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while approving leave');
    }
  };

  const handleRejectLeave = async (userId, leaveIndex) => {
    if (!confirm('Are you sure you want to reject this leave?')) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/leaves/${leaveIndex}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvedBy: user.name }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Leave rejected successfully');
        openUser(userId); // Refresh the user details
      } else {
        alert('Failed to reject leave: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while rejecting leave');
    }
  };

  // Group users by department
  const usersByDepartment = users.reduce((acc, user) => {
    const dept = user.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {});

  // Get department stats
  const departmentStats = Object.keys(usersByDepartment).map(dept => ({
    name: dept,
    count: usersByDepartment[dept].length,
    employees: usersByDepartment[dept]
  }));

  // restrict to admin role (frontend check)
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <Container maxWidth="xl" sx={{ mt: 6, mb: 6 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Admin Dashboard</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Department Overview" />
          <Tab label="Employee Details" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Department Statistics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Department Statistics</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {departmentStats.map((dept) => (
                    <Box key={dept.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{dept.name}</Typography>
                      <Chip label={dept.count} size="small" color="primary" />
                    </Box>
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Total employees: {users.length}
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Bonus Amount ($)"
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <Button
                    variant="contained"
                    color="success"
                    onClick={addBonusToAll}
                    disabled={addingBonus}
                    fullWidth
                  >
                    {addingBonus ? 'Adding Bonus...' : 'Add Bonus to All Employees'}
                  </Button>
                  {bonusMessage && (
                    <Alert severity={bonusMessage.includes('success') ? 'success' : 'error'} sx={{ mt: 1 }}>
                      {bonusMessage}
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={sendAllPayslips}
                    disabled={sendingAllPayslips}
                    fullWidth
                  >
                    {sendingAllPayslips ? 'Sending Payslips...' : `Send Payslips to All (${users.length})`}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={downloadAllPayslips}
                    disabled={downloadingPayslips}
                    fullWidth
                  >
                    {downloadingPayslips ? 'Downloading...' : `Download All Payslips (${users.length})`}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Department Accordions */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Employees by Department</Typography>
                {departmentStats.map((dept) => (
                  <Accordion key={dept.name} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <BusinessIcon color="primary" />
                        <Typography variant="h6">{dept.name}</Typography>
                        <Chip label={`${dept.count} employees`} size="small" />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {dept.employees.map(u => (
                          <ListItemButton key={u._id} onClick={() => { setActiveTab(1); openUser(u._id); }}>
                            <ListItemText
                              primary={u.name}
                              secondary={`${u.employeeId || ''} • ${u.position || ''}`}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid> 
        </Grid>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Card sx={{ width: 360 }}>
            <CardContent>
              <Typography variant="h6">Employees</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total employees: {users.length}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                {users.map(u => (
                  <ListItemButton key={u._id} selected={selected === u._id} onClick={() => openUser(u._id)}>
                    <ListItemText primary={u.name} secondary={`${u.employeeId || ''} • ${u.position || ''}`} />
                  </ListItemButton>
                ))}
                {users.length === 0 && <Typography variant="body2" sx={{ mt: 2 }}>No employees found</Typography>}
              </List>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              {!selected && <Typography variant="h6">Select an employee to view details</Typography>}
              {selected && !details && <Typography>Loading...</Typography>}
              {details && details.error && <Typography color="error">{details.error}</Typography>}
              {details && details.user && (
                <>
                  <Typography variant="h6">{details.user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{details.user.position} • {details.user.department}</Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Working hours</Typography>
                    <Typography>{details.computed.totalHours} hrs</Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Holidays</Typography>
                    {details.user.holidays?.length ? (
                      details.user.holidays.map((h, i) => <Typography key={i}>{h.date} — {h.name}</Typography>)
                    ) : <Typography className="muted">No holidays recorded</Typography>}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Leaves</Typography>
                    {details.user.leaves?.length ? (
                      details.user.leaves.map((l, i) => (
                        <Box key={i} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>{l.type}:</strong> {l.days} day(s) ({l.startDate} — {l.endDate})
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <strong>Status:</strong> <Chip
                              label={l.status}
                              size="small"
                              color={
                                l.status === 'approved' ? 'success' :
                                l.status === 'rejected' ? 'error' : 'warning'
                              }
                            />
                          </Typography>
                          {l.reason && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Reason:</strong> {l.reason}
                            </Typography>
                          )}
                          {l.approvedBy && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Approved by:</strong> {l.approvedBy} {l.approvedAt && `(${new Date(l.approvedAt).toLocaleDateString()})`}
                            </Typography>
                          )}
                          {l.status === 'pending' && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleApproveLeave(selected, i)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleRejectLeave(selected, i)}
                              >
                                Reject
                              </Button>
                            </Box>
                          )}
                        </Box>
                      ))
                    ) : <Typography className="muted">No leaves recorded</Typography>}
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">Calculated salary:</Typography>
                    <Typography variant="h5">${details.computed.salary.toFixed(2)}</Typography>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={() => openUser(selected)}>Refresh</Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => sendPayslip(selected)}
                      disabled={sendingPayslip}
                    >
                      {sendingPayslip ? 'Sending...' : 'Send Payslip'}
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
}
