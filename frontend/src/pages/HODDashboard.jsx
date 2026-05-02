import { useState, useEffect } from 'react';
import api from '../utils/api';
import { CheckCircle, XCircle, Bell, FileText, PieChart, Users, BookOpen, Download, Filter } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const HODDashboard = () => {
  const [activeTab, setActiveTab] = useState('review');
  const [pendingMarks, setPendingMarks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [marksRes, statsRes] = await Promise.all([
        api.get('/hod/pending-marks'),
        api.get('/hod/analytics')
      ]);
      setPendingMarks(marksRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching HOD data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (markIds, status) => {
    try {
      await api.put('/hod/review-marks', { markIds, status });
      alert(`Marks ${status} successfully!`);
      fetchData();
    } catch (error) {
      alert('Action failed');
    }
  };

  const handleMarkAsSeen = async () => {
    const unseenIds = pendingMarks.filter(m => !m.seenByHOD).map(m => m._id);
    if (unseenIds.length > 0) {
      try {
        await api.put('/hod/mark-as-seen', { markIds: unseenIds });
        // Update local state to remove badges without a full refetch
        setPendingMarks(prev => prev.map(m => ({ ...m, seenByHOD: true })));
      } catch (error) {
        console.error("Failed to mark as seen", error);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'review') {
      handleMarkAsSeen();
    }
  }, [activeTab, pendingMarks.length]);

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HOD Management Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Overseeing Department Academic Standards</p>
        </div>
        <div className="relative">
          <button className="p-2 bg-slate-50 rounded-full text-slate-600 hover:bg-slate-100 transition-all relative">
            <Bell size={20} />
            {pendingMarks.length > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap border-b border-slate-200">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<PieChart size={18}/>} label="Dept Progress" />
        <TabButton active={activeTab === 'review'} onClick={() => setActiveTab('review')} icon={<CheckCircle size={18}/>} label={`Pending Review (${pendingMarks.length})`} />
        <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={18}/>} label="Semester Reports" />
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && <Overview stats={stats} />}
        {activeTab === 'review' && <ReviewQueue marks={pendingMarks} onReview={handleReview} />}
        {activeTab === 'reports' && <ReportsView />}
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

const Overview = ({ stats }) => {
  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Department Students" value={stats.totalStudents} icon={<Users className="text-blue-600"/>} />
        <StatCard title="Active Faculty" value={stats.totalFaculty} icon={<Users className="text-emerald-600"/>} />
        <StatCard title="Avg Pass Rate" value={`${stats.passPercentage}%`} icon={<PieChart className="text-violet-600"/>} />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-6 text-slate-800 text-center">Current Semester Academic Success</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RePie>
              <Pie
                data={stats.chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </RePie>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const ReviewQueue = ({ marks, onReview }) => {
  if (marks.length === 0) return (
    <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center">
      <div className="inline-flex p-4 bg-emerald-50 text-emerald-500 rounded-full mb-4">
        <CheckCircle size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-800">No Pending Submissions</h3>
      <p className="text-slate-500 mt-1">All faculty marks have been reviewed and finalized.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800">Pending Mark Submissions</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => onReview(marks.map(m => m._id), 'Approved')}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-sm"
          >
            Approve All
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Faculty</th>
              <th className="px-6 py-4 text-center">Total Score</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {marks.map((mark) => (
              <tr key={mark._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{mark.student?.name}</span>
                      {!mark.seenByHOD && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-[8px] text-white font-bold rounded flex items-center">NEW</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">Sem {mark.student?.semester} • Sec {mark.student?.section}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{mark.subject?.name}</span>
                    <span className="text-xs text-slate-400">{mark.subject?.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{mark.faculty?.name}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg text-sm">
                    {mark.total}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onReview([mark._id], 'Approved')}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => onReview([mark._id], 'Rejected')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Reject"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsView = () => {
  const downloadPDF = (semester) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Semester ${semester} Performance Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Department results and faculty compliance report.`, 14, 30);
    
    doc.autoTable({
      startY: 40,
      head: [['Subject', 'Faculty', 'Avg Marks', 'Status']],
      body: [
        ['Data Structures', 'Dr. Smith', '28.5', 'Finalized'],
        ['DBMS', 'Prof. Jones', '24.2', 'Pending Review'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });
    doc.save(`Sem_${semester}_Report.pdf`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
        <div key={sem} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-primary/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
              <FileText size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">ACTIVE</span>
          </div>
          <h4 className="font-bold text-slate-800">Semester {sem}</h4>
          <p className="text-xs text-slate-500 mt-1">Full result compilation & analysis</p>
          <button 
            onClick={() => downloadPDF(sem)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-all"
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
    </div>
  </div>
);

export default HODDashboard;
