import { useState, useEffect } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { Download, User, Mail, Phone, Book, Hash, Layers, GraduationCap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentDashboard = () => {
  const [marks, setMarks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marksRes, profileRes] = await Promise.all([
          api.get('/student/marks'),
          api.get('/student/profile')
        ]);
        setMarks(marksRes.data);
        setProfile(profileRes.data);
      } catch (error) {
        console.error("Error fetching student data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const downloadPDF = () => {
    if (!profile) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Academic Performance Report', 14, 22);
    
    // Student Info
    doc.setFontSize(10);
    doc.text(`Name: ${profile.name}`, 14, 32);
    doc.text(`Roll No: ${profile.studentId}`, 14, 38);
    doc.text(`Branch: ${profile.department?.name || 'N/A'}`, 14, 44);
    doc.text(`Semester: ${profile.semester} | Section: ${profile.section}`, 14, 50);
    
    // Table
    const tableColumn = ["Subject Code", "Subject Name", "Mid 1", "Mid 2", "A1", "A2", "Final Total"];
    const tableRows = marks.map(mark => [
      mark.subject?.code,
      mark.subject?.name,
      mark.mid1,
      mark.mid2,
      mark.assignment1,
      mark.assignment2,
      mark.total
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 58,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`${profile.studentId}_Marks_Report.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Student Profile Header */}
      {profile && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10"></div>
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            {/* Photo */}
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-md bg-slate-100 flex-shrink-0">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User size={48} />
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
              <div className="sm:col-span-2 lg:col-span-3 pb-2 border-b border-slate-100">
                <h2 className="text-2xl font-extrabold text-slate-800">{profile.name}</h2>
                <p className="text-primary font-bold text-sm tracking-widest uppercase mt-1">Student Account</p>
              </div>

              <InfoItem icon={<Hash size={16}/>} label="Roll Number" value={profile.studentId} />
              <InfoItem icon={<GraduationCap size={16}/>} label="Branch / Dept" value={profile.department?.name || 'N/A'} />
              <InfoItem icon={<Layers size={16}/>} label="Semester" value={`Semester ${profile.semester}`} />
              <InfoItem icon={<Book size={16}/>} label="Section" value={`Section ${profile.section}`} />
              <InfoItem icon={<Mail size={16}/>} label="Email Address" value={profile.email} />
              <InfoItem icon={<Phone size={16}/>} label="Phone Number" value={profile.phone || 'Not Provided'} />
            </div>
          </div>
        </div>
      )}

      {/* Marks Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Academic Performance</h3>
            <p className="text-sm text-slate-500 mt-1">Final internal marks calculated by faculty and approved by HOD</p>
          </div>
          <button 
            onClick={downloadPDF}
            disabled={marks.length === 0}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            <Download size={18} />
            Export Marks PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                <th className="px-4 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Mid 1</th>
                <th className="px-4 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Mid 2</th>
                <th className="px-4 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Asn 1</th>
                <th className="px-4 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Asn 2</th>
                <th className="px-8 py-5 text-center text-xs font-bold text-primary uppercase tracking-widest">Internal Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marks.map((mark) => (
                <tr key={mark._id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-800">{mark.subject?.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{mark.subject?.code}</p>
                  </td>
                  <td className="px-4 py-6 text-center text-sm font-medium text-slate-600">{mark.mid1}</td>
                  <td className="px-4 py-6 text-center text-sm font-medium text-slate-600">{mark.mid2}</td>
                  <td className="px-4 py-6 text-center text-sm font-medium text-slate-600">{mark.assignment1}</td>
                  <td className="px-4 py-6 text-center text-sm font-medium text-slate-600">{mark.assignment2}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-extrabold px-4 py-2 rounded-xl text-sm min-w-[3rem]">
                      {mark.total}
                    </span>
                  </td>
                </tr>
              ))}
              {marks.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <Book size={40} />
                      </div>
                      <p className="text-slate-400 font-medium">No approved marks available yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 p-1.5 bg-slate-50 text-slate-400 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-700 mt-0.5">{value}</p>
    </div>
  </div>
);

export default StudentDashboard;
