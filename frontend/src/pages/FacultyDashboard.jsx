import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Filter, CheckCircle, Send, Save, Download, BookOpen, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FacultyDashboard = () => {
  useAuthStore();
  const [filters, setFilters] = useState({ department: '', semester: '', section: '', subject: '' });
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [depts, setDepts] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ mid1Max: 30, mid2Max: 30, assignment1Max: 5, assignment2Max: 5, higherMidWeight: 0.8, lowerMidWeight: 0.2 });
  const [studentSearch, setStudentSearch] = useState('');
  const [facultyInfo, setFacultyInfo] = useState({ name: '', department: null });
  
  // Local state for unsaved marks in the table
  const [localMarks, setLocalMarks] = useState({}); // { studentId: { mid1, mid2, assignment1, assignment2 } }

  useEffect(() => {
    const fetchMetadata = async () => {
      api.get('/faculty/my-subjects')
        .then(res => {
          const data = res.data;
          setFacultyInfo({ name: data.name, department: data.department });
          const populated = data.assignedSubjects || [];
          setAssignedSubjects(populated);
          const deptId = data.department?._id || data.department;
          const firstSem = populated[0]?.semester;
          setFilters(prev => ({
            ...prev,
            department: deptId ? String(deptId) : prev.department,
            semester: firstSem ? String(firstSem) : prev.semester,
          }));
        })
        .catch(err => console.error('Error fetching faculty profile:', err));

      api.get('/data/departments')
        .then(res => setDepts(res.data))
        .catch(err => console.error('Error fetching departments:', err));

      api.get('/faculty/marks')
        .then(res => setHistory(res.data))
        .catch(err => console.error('Error fetching history:', err));

      api.get('/settings')
        .then(res => setSettings(res.data))
        .catch(err => console.error('Error fetching settings:', err));
    };
    fetchMetadata();
  }, []);

  const handleSearch = async () => {
    if (!filters.department || !filters.semester || !filters.section || !filters.subject) {
      alert('Please select Branch, Semester, Section and Subject before fetching students.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/faculty/students?department=${filters.department}&semester=${filters.semester}&section=${filters.section}`);
      setStudents(res.data);
      
      // Initialize local marks from history
      const initialMarks = {};
      res.data.forEach(student => {
        const existing = history.find(h => h.student?._id === student._id && h.subject?._id === filters.subject);
        initialMarks[student._id] = {
          mid1: existing?.mid1 ?? '',
          mid2: existing?.mid2 ?? '',
          assignment1: existing?.assignment1 ?? '',
          assignment2: existing?.assignment2 ?? '',
        };
      });
      setLocalMarks(initialMarks);

      if (res.data.length === 0) alert('No students found for the selected filters.');
    } catch { alert('Failed to fetch students. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleSingleSubmit = async (studentId, status) => {
    const marksData = localMarks[studentId];
    try {
      await api.post('/faculty/marks', {
        studentId,
        subjectId: filters.subject,
        ...marksData,
        status,
      });
      alert(`Marks ${status === 'Draft' ? 'saved as Draft' : 'submitted to HOD'}!`);
      const histRes = await api.get('/faculty/marks');
      setHistory(histRes.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  const handleBulkSubmit = async () => {
    if (students.length === 0) return;
    if (!window.confirm(`Submit all ${students.length} students' marks to HOD for approval? This will lock approved marks.`)) return;

    setLoading(true);
    let successCount = 0;
    try {
      for (const student of students) {
        const existingMark = history.find(h => h.student?._id === student._id && h.subject?._id === filters.subject);
        if (existingMark?.status === 'Approved') continue; // Skip locked marks

        const marksData = localMarks[student._id];
        await api.post('/faculty/marks', {
          studentId: student._id,
          subjectId: filters.subject,
          ...marksData,
          status: 'Submitted',
        });
        successCount++;
      }
      alert(`Successfully submitted ${successCount} marks to HOD!`);
      const histRes = await api.get('/faculty/marks');
      setHistory(histRes.data);
    } catch (error) {
      alert('Bulk submission partially failed or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const selectedSubjectObj = assignedSubjects.find(s => s._id === filters.subject);

  const filteredStudents = (students || [])
    .filter(s => {
      const q = studentSearch.toLowerCase();
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.section?.toLowerCase().includes(q) ||
        s.department?.name?.toLowerCase().includes(q) ||
        String(s.semester)?.includes(q)
      );
    })
    .sort((a, b) => a.studentId?.localeCompare(b.studentId, undefined, { numeric: true }));

  const handleDownloadPDF = () => {
    if (students.length === 0) { alert('No students loaded to generate report.'); return; }
    const doc = new jsPDF();
    const deptName = depts.find(d => d._id === filters.department)?.name || 'N/A';
    const subjectObj = selectedSubjectObj;

    doc.setFontSize(16);
    doc.text('Internal Marks Report (Faculty Copy)', 14, 15);
    doc.setFontSize(10);
    doc.text(`Faculty: ${facultyInfo.name}`, 14, 25);
    doc.text(`Branch: ${deptName}  |  Semester: ${filters.semester}  |  Section: ${filters.section}`, 14, 31);
    doc.text(`Subject: ${subjectObj?.name || ''} (${subjectObj?.code || ''})`, 14, 37);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 43);

    const tableData = filteredStudents.map((student, idx) => {
      const mark = history.find(h => h.student?._id === student._id && h.subject?._id === filters.subject);
      const currentLocal = localMarks[student._id] || {};
      
      // Use local marks if not submitted yet, otherwise use history
      const m1 = currentLocal.mid1 || '-';
      const m2 = currentLocal.mid2 || '-';
      const a1 = currentLocal.assignment1 || '-';
      const a2 = currentLocal.assignment2 || '-';
      
      // Calculate total for PDF
      const higherMid = Math.max(Number(m1)||0, Number(m2)||0);
      const lowerMid = Math.min(Number(m1)||0, Number(m2)||0);
      const total = Math.round((settings.higherMidWeight * higherMid) + (settings.lowerMidWeight * lowerMid) + (Number(a1)||0) + (Number(a2)||0));

      return [idx + 1, student.studentId, student.name, m1, m2, a1, a2, total, mark?.status || 'Not Submitted'];
    });

    autoTable(doc, {
      startY: 50,
      head: [['#', 'Roll No', 'Name', `Mid1\n(${settings.mid1Max})`, `Mid2\n(${settings.mid2Max})`, `Assn1\n(${settings.assignment1Max})`, `Assn2\n(${settings.assignment2Max})`, 'Total', 'Status']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Marks_Report_${deptName}_Sem${filters.semester}_Sec${filters.section}_${subjectObj?.code || 'Subject'}.pdf`);
  };

  const totalMax = settings.mid1Max + settings.mid2Max + settings.assignment1Max + settings.assignment2Max;

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><Filter size={20} /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Academic Filters</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Select criteria to fetch class students</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {facultyInfo.name && (
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{facultyInfo.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{typeof facultyInfo.department === 'object' ? facultyInfo.department.name : 'Faculty'}</p>
                </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select className="p-3 border rounded-xl bg-slate-50 text-sm" value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value, subject: '' })}>
            <option value="">Select Branch</option>
            {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="p-3 border rounded-xl bg-slate-50 text-sm" value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <select className="p-3 border rounded-xl bg-slate-50 text-sm" value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value })}>
            <option value="">Select Section</option>
            {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <select
            className="p-3 border rounded-xl bg-slate-50 text-sm"
            value={filters.subject}
            onChange={e => {
              const selected = assignedSubjects.find(s => s._id === e.target.value);
              setFilters(prev => ({
                ...prev,
                subject: e.target.value,
                semester: selected ? String(selected.semester) : prev.semester,
              }));
            }}
          >
            <option value="">Select Subject</option>
            {assignedSubjects.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.code}) — Sem {s.semester}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:bg-slate-400 py-3"
          >
            <Search size={18} /> {loading ? 'Fetching...' : 'Fetch Students'}
          </button>
        </div>
      </div>

      {/* Marks Entry Table */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800">
                  {selectedSubjectObj?.name} ({selectedSubjectObj?.code})
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage marks for Section {filters.section} — Sem {filters.semester}
                </p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Maximum</span>
                <span className="text-sm font-bold text-primary">{totalMax} Marks</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                <Download size={15} /> Export PDF
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <Send size={15} /> Submit All to HOD
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2 text-[11px] text-amber-700">
            <AlertCircle size={14} />
            <span>Note: Once marks are submitted and approved by HOD, they will be <strong>locked</strong> and cannot be edited.</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-6 py-4">Student Info</th>
                  <th className="px-4 py-4 text-center">Mid 1 ({settings.mid1Max})</th>
                  <th className="px-4 py-4 text-center">Mid 2 ({settings.mid2Max})</th>
                  <th className="px-4 py-4 text-center">Assn 1 ({settings.assignment1Max})</th>
                  <th className="px-4 py-4 text-center">Assn 2 ({settings.assignment2Max})</th>
                  <th className="px-4 py-4 text-center">Calculated Total</th>
                  <th className="px-4 py-4 text-center">Status</th>
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
                    localValue={localMarks[student._id] || { mid1: '', mid2: '', assignment1: '', assignment2: '' }}
                    setLocalValue={(val) => setLocalMarks(prev => ({ ...prev, [student._id]: val }))}
                    onSingleSubmit={(status) => handleSingleSubmit(student._id, status)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity / Submission History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-primary" />
            <h3 className="font-bold text-slate-800">Your Recent Submissions</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">{history.length} records found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              {history.slice(0, 10).map((mark) => (
                <tr key={mark._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{mark.student?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{mark.subject?.name}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-primary">{mark.total} Marks</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      mark.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      mark.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      mark.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {mark.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td className="p-10 text-center text-slate-400 text-sm italic">No recent submission history.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MarksEntryRow = ({ student, settings, existingMark, localValue, setLocalValue, onSingleSubmit }) => {
  const isLocked = existingMark?.status === 'Approved';
  
  const m1 = Number(localValue.mid1) || 0;
  const m2 = Number(localValue.mid2) || 0;
  const a1 = Number(localValue.assignment1) || 0;
  const a2 = Number(localValue.assignment2) || 0;
  
  const higherMid = Math.max(m1, m2);
  const lowerMid = Math.min(m1, m2);
  const w = settings.higherMidWeight || 0.8;
  const lw = settings.lowerMidWeight || 0.2;
  
  const liveTotal = (localValue.mid1 === '' && localValue.mid2 === '' && localValue.assignment1 === '' && localValue.assignment2 === '') ? '-' :
    Math.round(w * higherMid + lw * lowerMid + a1 + a2);

  return (
    <tr className={`border-b border-slate-100 last:border-0 ${isLocked ? 'bg-emerald-50/20' : ''} transition-colors`}>
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-slate-800">{student.name}</p>
        <p className="text-[10px] font-bold text-primary">{student.studentId}</p>
      </td>
      {[
        { key: 'mid1', max: settings.mid1Max },
        { key: 'mid2', max: settings.mid2Max },
        { key: 'assignment1', max: settings.assignment1Max },
        { key: 'assignment2', max: settings.assignment2Max },
      ].map(({ key, max }) => (
        <td key={key} className="px-4 py-4">
          <input
            disabled={isLocked}
            type="number"
            max={max}
            className="w-16 mx-auto block p-2 border rounded-xl text-center text-sm disabled:bg-transparent disabled:border-transparent font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            value={localValue[key]}
            onChange={e => {
              const val = Math.min(Number(e.target.value), max);
              setLocalValue({ ...localValue, [key]: val >= 0 ? val : '' });
            }}
          />
        </td>
      ))}
      <td className="px-4 py-4 text-center">
        <span className={`text-sm font-extrabold ${liveTotal === '-' ? 'text-slate-300' : 'text-primary'}`}>
          {liveTotal}
        </span>
      </td>
      <td className="px-4 py-4 text-center">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          existingMark?.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
          existingMark?.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {existingMark?.status || 'Pending'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        {!isLocked && (
          <div className="flex justify-end gap-2">
            <button onClick={() => onSingleSubmit('Draft')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Save Draft">
              <Save size={16} />
            </button>
            <button onClick={() => onSingleSubmit('Submitted')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Submit to HOD">
              <Send size={16} />
            </button>
          </div>
        )}
        {isLocked && (
          <div className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-bold">
            <CheckCircle size={14} /> Finalized
          </div>
        )}
      </td>
    </tr>
  );
};

export default FacultyDashboard;
