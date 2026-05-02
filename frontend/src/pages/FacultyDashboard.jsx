import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Filter, BookOpen, User, CheckCircle, Clock, AlertCircle, Send, Save } from 'lucide-react';
import useAuthStore from '../store/authStore';

const FacultyDashboard = () => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({ department: '', semester: '', section: '', subject: '' });
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [depts, setDepts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ mid1Max: 30, mid2Max: 30, assignment1Max: 5, assignment2Max: 5 });
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch initial data (Depts, Subjects, Settings)
  useEffect(() => {
    const fetchMetadata = async () => {
      // Fetch Departments
      api.get('/data/departments')
        .then(res => setDepts(res.data))
        .catch(err => console.error("Error fetching departments:", err));

      // Fetch Subjects
      api.get('/data/subjects')
        .then(res => setSubjects(res.data))
        .catch(err => console.error("Error fetching subjects:", err));

      // Fetch History
      api.get('/faculty/marks')
        .then(res => setHistory(res.data))
        .catch(err => console.error("Error fetching history:", err));

      // Fetch Settings
      api.get('/settings')
        .then(res => setSettings(res.data))
        .catch(err => console.error("Error fetching settings:", err));
    };
    fetchMetadata();
  }, []);

  const handleSearch = async () => {
    if (!filters.department || !filters.semester || !filters.section || !filters.subject) {
      alert('Please select all filters to fetch students');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/faculty/students?department=${filters.department}&semester=${filters.semester}&section=${filters.section}`);
      setStudents(res.data);
    } catch (err) { alert('Search failed'); }
    finally { setLoading(false); }
  };

  const handleMarksSubmit = async (studentId, marksData, status) => {
    try {
      await api.post('/faculty/marks', {
        studentId,
        subjectId: filters.subject,
        ...marksData,
        status: status // 'Draft' or 'Submitted'
      });
      alert(`Marks ${status === 'Draft' ? 'Saved' : 'Submitted to HOD'}!`);
      // Refresh history
      const histRes = await api.get('/faculty/marks');
      setHistory(histRes.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  const filteredStudents = (students || [])
    .filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
      s.studentId.toLowerCase().includes(studentSearch.toLowerCase())
    )
    .sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, {numeric: true}));

  return (
    <div className="space-y-6">
      {/* Selection Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Filter size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Academic Filters</h2>
          </div>
          <div className="text-[10px] font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-widest">
            Institutional Configuration Active
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select className="p-3 border rounded-xl bg-slate-50 text-sm" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
            <option value="">Select Department</option>
            {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="p-3 border rounded-xl bg-slate-50 text-sm" value={filters.semester} onChange={e => setFilters({...filters, semester: e.target.value})}>
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <select className="p-3 border rounded-xl bg-slate-50 text-sm" value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})}>
            <option value="">Select Section</option>
            {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <select className="p-3 border rounded-xl bg-slate-50 text-sm" value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})}>
            <option value="">Select Subject</option>
            {subjects
              .filter(s => s.branch?._id === filters.department && s.semester == filters.semester)
              .filter(s => !user.assignedSubjects || user.assignedSubjects.length === 0 || user.assignedSubjects.some(as => as._id === s._id || as === s._id))
              .map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))
            }
          </select>
          <button 
            onClick={handleSearch}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Search size={18} /> Fetch Students
          </button>
        </div>
      </div>

      {/* Marks Entry Table */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Marks Entry Sheet (Sorted by Roll No)</h3>
            <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search name or roll no..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4 text-center">Mid 1 (Max {settings.mid1Max})</th>
                  <th className="px-6 py-4 text-center">Mid 2 (Max {settings.mid2Max})</th>
                  <th className="px-6 py-4 text-center">Assign 1 (Max {settings.assignment1Max})</th>
                  <th className="px-6 py-4 text-center">Assign 2 (Max {settings.assignment2Max})</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <MarksEntryRow 
                    key={student._id} 
                    student={student} 
                    settings={settings}
                    existingMark={history.find(h => h.student?._id === student._id && h.subject?._id === filters.subject)}
                    onSubmit={handleMarksSubmit} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History & Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Submission History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((mark) => (
                <tr key={mark._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{mark.subject?.name}</span>
                      <span className="text-[10px] text-slate-400">{mark.subject?.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{mark.student?.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      mark.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      mark.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      mark.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {mark.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-primary">{mark.total}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="4" className="p-10 text-center text-slate-400 text-sm">No submissions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MarksEntryRow = ({ student, existingMark, settings, onSubmit }) => {
  const [marks, setMarks] = useState({
    mid1: existingMark?.mid1 || '',
    mid2: existingMark?.mid2 || '',
    assignment1: existingMark?.assignment1 || '',
    assignment2: existingMark?.assignment2 || ''
  });

  const isLocked = existingMark?.status === 'Approved';

  return (
    <tr className={`border-b border-slate-100 last:border-0 ${isLocked ? 'bg-slate-50/50' : ''} transition-colors`}>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800">{student.name}</span>
          <span className="text-[10px] font-bold text-primary">{student.studentId}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <input 
          disabled={isLocked}
          type="number" max={settings.mid1Max} min="0" 
          className="w-16 mx-auto block p-2 border rounded-xl text-center text-sm disabled:bg-transparent font-medium" 
          value={marks.mid1} onChange={e => setMarks({...marks, mid1: e.target.value})} 
        />
      </td>
      <td className="px-6 py-4">
        <input 
          disabled={isLocked}
          type="number" max={settings.mid2Max} min="0" 
          className="w-16 mx-auto block p-2 border rounded-xl text-center text-sm disabled:bg-transparent font-medium" 
          value={marks.mid2} onChange={e => setMarks({...marks, mid2: e.target.value})} 
        />
      </td>
      <td className="px-6 py-4">
        <input 
          disabled={isLocked}
          type="number" max={settings.assignment1Max} min="0" 
          className="w-16 mx-auto block p-2 border rounded-xl text-center text-sm disabled:bg-transparent font-medium" 
          value={marks.assignment1} onChange={e => setMarks({...marks, assignment1: e.target.value})} 
        />
      </td>
      <td className="px-6 py-4">
        <input 
          disabled={isLocked}
          type="number" max={settings.assignment2Max} min="0" 
          className="w-16 mx-auto block p-2 border rounded-xl text-center text-sm disabled:bg-transparent font-medium" 
          value={marks.assignment2} onChange={e => setMarks({...marks, assignment2: e.target.value})} 
        />
      </td>
      <td className="px-6 py-4 text-right">
        {isLocked ? (
          <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold text-xs uppercase">
            <CheckCircle size={14} /> Locked
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => onSubmit(student._id, marks, 'Draft')}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Save Draft"
            >
              <Save size={18} />
            </button>
            <button 
              onClick={() => onSubmit(student._id, marks, 'Submitted')}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Submit to HOD"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default FacultyDashboard;
