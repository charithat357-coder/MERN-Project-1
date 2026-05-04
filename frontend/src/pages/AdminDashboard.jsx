import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { Users, BookOpen, Building, Settings as SettingsIcon, PieChart, Plus, Edit, Trash2, FileText, Download, Search, Filter, UserCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [adminProfile, setAdminProfile] = useState({ name: 'System Administrator', photo: null });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminProfile({ ...adminProfile, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Profile */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {adminProfile.photo ? (
              <img src={adminProfile.photo} className="w-12 h-12 rounded-full object-cover border-2 border-primary" alt="Admin" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-slate-200 group-hover:border-primary transition-colors cursor-pointer">
                <UserCircle size={28} />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-100 cursor-pointer hover:bg-slate-50">
              <Plus size={10} className="text-primary font-bold" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </label>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{adminProfile.name}</h1>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Global Admin</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveTab('settings')} className="p-2 text-slate-400 hover:text-primary transition-colors"><SettingsIcon size={20}/></button>
        </div>
      </div>

      <div className="flex flex-wrap border-b border-slate-200">
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<PieChart size={18}/>} label="Analytics" />
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18}/>} label="Users" />
        <TabButton active={activeTab === 'academic'} onClick={() => setActiveTab('academic')} icon={<Building size={18}/>} label="Academic Structure" />
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={18}/>} label="Settings" />
      </div>
      
      <div className="mt-6">
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'academic' && <AcademicView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all ${
      active ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
    }`}
  >
    {icon} {label}
  </button>
);

const AnalyticsView = () => {
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, totalSubjects: 0, totalDepartments: 0 });
  const [loading, setLoading] = useState(true);

  const graphData = [
    { name: 'CSE', average: 82, passRate: 90 },
    { name: 'ECE', average: 75, passRate: 85 },
    { name: 'ME', average: 68, passRate: 78 },
    { name: 'CE', average: 72, passRate: 82 },
    { name: 'IT', average: 88, passRate: 95 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/admin/analytics');
        setStats(statsRes.data);
      } catch (error) {
        console.error("Error fetching analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Institution Wide Performance Report', 14, 25);
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 48);
    
    doc.setFontSize(14);
    doc.text('Executive Summary', 14, 60);
    doc.setFontSize(10);
    doc.text(`Total Students: ${stats.totalStudents}`, 14, 68);
    doc.text(`Total Faculty: ${stats.totalFaculty}`, 14, 74);
    doc.text(`Total Departments: ${stats.totalDepartments}`, 14, 80);
    doc.text(`Total Subjects: ${stats.totalSubjects}`, 14, 86);
    
    const tableColumn = ["Department", "Average Score", "Pass Rate (%)"];
    const tableRows = graphData.map(d => [d.name, d.average, d.passRate]);
    
    autoTable(doc, {
      startY: 95,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
    });
    
    doc.save('College_Performance_Report.pdf');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading metrics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">System Overview</h2>
        <button 
          onClick={downloadReport}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
        >
          <Download size={18} /> Export Performance PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents} icon={<Users size={24} className="text-blue-600"/>} trend="+5% this month" />
        <StatCard title="Total Faculty" value={stats.totalFaculty} icon={<Users size={24} className="text-emerald-600"/>} trend="Stable" />
        <StatCard title="Subjects" value={stats.totalSubjects} icon={<BookOpen size={24} className="text-violet-600"/>} trend="2 New" />
        <StatCard title="Departments" value={stats.totalDepartments} icon={<Building size={24} className="text-orange-600"/>} trend="Active" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Department Performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="average" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Pass Rate Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={3} dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">{trend}</span>
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h4 className="text-3xl font-bold text-slate-900 mt-1">{value}</h4>
    </div>
  </div>
);

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [depts, setDepts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'Student', phone: '', department: '', semester: '', section: '', assignedSubjects: [], photo: null
  });
  const [allSubjects, setAllSubjects] = useState([]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMetadata = async () => {
    try {
      const [dRes, sRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/subjects')
      ]);
      setDepts(dRes.data);
      setAllSubjects(sRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
     
    fetchMetadata();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesDept = deptFilter === 'All' || user.department?._id === deptFilter;
      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, searchQuery, roleFilter, deptFilter]);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.put(`/admin/users/${editingUserId}`, formData);
        alert('User updated successfully');
      } else {
        await api.post('/admin/users', formData);
        alert('User added successfully');
      }
      setShowAdd(false);
      setEditingUserId(null);
      setFormData({ name: '', email: '', password: '', role: 'Student', phone: '', department: '', semester: '', section: '', assignedSubjects: [], photo: null });
      fetchUsers();
    } catch { alert('Failed to save user'); }
  };

  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'Student',
      phone: user.phone || '',
      department: user.department?._id || '',
      semester: user.semester || '',
      section: user.section || '',
      assignedSubjects: user.assignedSubjects?.map(s => s._id) || [],
      photo: user.photo || null
    });
    setShowAdd(true);
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading directory...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <h3 className="font-bold text-slate-800">User Directory</h3>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              if (showAdd) {
                setShowAdd(false);
                setEditingUserId(null);
                setFormData({ name: '', email: '', password: '', role: 'Student', phone: '', department: '', semester: '', section: '', assignedSubjects: [], photo: null });
              } else {
                setShowAdd(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
          >
            {showAdd ? 'Cancel' : <><Plus size={18} /> Add User</>}
          </button>
        </div>
      </div>

      <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Filter size={16} /> Filters:
        </div>
        <select 
          className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-primary/10"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="HOD">HOD</option>
          <option value="Faculty">Faculty</option>
          <option value="Student">Student</option>
        </select>
        <select 
          className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-primary/10"
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
        >
          <option value="All">All Departments</option>
          {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <div className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-widest">
          Showing {filteredUsers.length} of {users.length} Users
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSaveUser} className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-200">
          <input className="p-2 border rounded" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input className="p-2 border rounded" placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input className="p-2 border rounded" placeholder={editingUserId ? "Password (leave blank to keep)" : "Password"} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingUserId} />
          <select className="p-2 border rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
            <option value="Admin">Admin</option>
            <option value="HOD">HOD</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Student</option>
          </select>
          <input className="p-2 border rounded" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <select className="p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
            <option value="">Select Department</option>
            {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input className="p-2 border rounded" placeholder="Semester" type="number" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
          <input className="p-2 border rounded" placeholder="Section" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">User Photo</label>
            <input 
              type="file" 
              accept="image/*" 
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
          
          {formData.role === 'Faculty' && (
            <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Assign Subjects (Multi-select)</p>
              <div className="flex flex-wrap gap-2">
                {allSubjects.map(sub => (
                  <label key={sub._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    formData.assignedSubjects.includes(sub._id) ? 'bg-primary text-white border-primary' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-primary'
                  }`}>
                    <input 
                      type="checkbox" className="hidden" 
                      checked={formData.assignedSubjects.includes(sub._id)}
                      onChange={(e) => {
                        const newSubs = e.target.checked 
                          ? [...formData.assignedSubjects, sub._id]
                          : formData.assignedSubjects.filter(id => id !== sub._id);
                        setFormData({...formData, assignedSubjects: newSubs});
                      }}
                    />
                    {sub.name} ({sub.code})
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <button className="md:col-span-4 p-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors">
            {editingUserId ? 'Update Account' : 'Create Account'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Academic Info</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'HOD' ? 'bg-amber-100 text-amber-700' :
                    user.role === 'Faculty' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {user.department?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {user.role === 'Student' ? `Sem ${user.semester || '-'} • Sec ${user.section || '-'}` : 
                   user.role === 'Faculty' ? (
                     <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-slate-400">DEALING WITH:</span>
                       <div className="flex flex-wrap gap-1">
                         {user.assignedSubjects?.map(s => (
                           <span key={s._id} className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold rounded text-slate-600">{s.code}</span>
                         ))}
                         {(!user.assignedSubjects || user.assignedSubjects.length === 0) && '-'}
                       </div>
                     </div>
                   ) : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" onClick={() => handleEditClick(user)}><Edit size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={async () => { if(window.confirm('Delete?')) { await api.delete(`/admin/users/${user._id}`); fetchUsers(); } }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-slate-400 text-sm">No users found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AcademicView = () => {
  const [depts, setDepts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);

  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [subForm, setSubForm] = useState({ name: '', code: '', semester: '', branch: '' });

  const fetchData = async () => {
    try {
      const [d, s] = await Promise.all([api.get('/admin/departments'), api.get('/admin/subjects')]);
      setDepts(d.data);
      setSubjects(s.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const addDept = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/departments', deptForm); setShowAddDept(false); fetchData(); } catch { alert('Failed'); }
  };

  const addSub = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/subjects', subForm); setShowAddSub(false); fetchData(); } catch { alert('Failed'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800">Branches / Departments</h3>
          <button onClick={() => setShowAddDept(!showAddDept)} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"><Plus size={18}/></button>
        </div>
        {showAddDept && (
          <form onSubmit={addDept} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-3">
            <input className="w-full p-2 border rounded" placeholder="Branch Name" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} required />
            <input className="w-full p-2 border rounded" placeholder="Branch Code" value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} required />
            <button className="w-full p-2 bg-slate-800 text-white rounded">Add Branch</button>
          </form>
        )}
        <div className="space-y-3">
          {depts.map((d) => (
            <div key={d._id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-bold text-slate-700">{d.name}</p>
                <p className="text-xs text-slate-400">{d.code}</p>
              </div>
              <button onClick={async () => { if(window.confirm('Delete?')) { await api.delete(`/admin/departments/${d._id}`); fetchData(); } }} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800">Subjects Repository</h3>
          <button onClick={() => setShowAddSub(!showAddSub)} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"><Plus size={18}/></button>
        </div>
        {showAddSub && (
          <form onSubmit={addSub} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-3">
            <input className="w-full p-2 border rounded" placeholder="Subject Name" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} required />
            <input className="w-full p-2 border rounded" placeholder="Subject Code" value={subForm.code} onChange={e => setSubForm({...subForm, code: e.target.value})} required />
            <input className="w-full p-2 border rounded" placeholder="Semester" type="number" value={subForm.semester} onChange={e => setSubForm({...subForm, semester: e.target.value})} required />
            <select className="w-full p-2 border rounded" value={subForm.branch} onChange={e => setSubForm({...subForm, branch: e.target.value})} required>
              <option value="">Select Branch</option>
              {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <button className="w-full p-2 bg-slate-800 text-white rounded">Add Subject</button>
          </form>
        )}
        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s._id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-bold text-slate-700">{s.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{s.code} • Sem {s.semester} • {s.branch?.name}</p>
              </div>
              <button onClick={async () => { if(window.confirm('Delete?')) { await api.delete(`/admin/subjects/${s._id}`); fetchData(); } }} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsView = () => {
  const [settings, setSettings] = useState({
    mid1Max: 30, mid2Max: 30, assignment1Max: 5, assignment2Max: 5, higherMidWeight: 0.8, lowerMidWeight: 0.2
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data);
      } catch (err) { console.error(err); }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      alert('Institutional settings updated!');
    } catch { alert('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-4xl">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Institutional Configuration</h3>
        <p className="text-xs text-slate-500 mt-1">Global marks limits and calculation weights for all departments.</p>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-10">
          <InputGroup label="Mid 1 Maximum" value={settings.mid1Max} onChange={v => setSettings({...settings, mid1Max: v})} />
          <InputGroup label="Mid 2 Maximum" value={settings.mid2Max} onChange={v => setSettings({...settings, mid2Max: v})} />
          <InputGroup label="Assignment 1 Maximum" value={settings.assignment1Max} onChange={v => setSettings({...settings, assignment1Max: v})} />
          <InputGroup label="Assignment 2 Maximum" value={settings.assignment2Max} onChange={v => setSettings({...settings, assignment2Max: v})} />
          <InputGroup label="Higher Mid Weight (0 to 1)" value={settings.higherMidWeight} step="0.05" onChange={v => setSettings({...settings, higherMidWeight: v})} />
          <InputGroup label="Lower Mid Weight (0 to 1)" value={settings.lowerMidWeight} step="0.05" onChange={v => setSettings({...settings, lowerMidWeight: v})} />
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto px-10 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:bg-slate-400"
        >
          {saving ? 'Updating System...' : 'Save System Settings'}
        </button>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, step = "1" }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
    <input 
      type="number" 
      step={step}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700"
      value={value} 
      onChange={e => onChange(Number(e.target.value))} 
    />
  </div>
);

export default AdminDashboard;
