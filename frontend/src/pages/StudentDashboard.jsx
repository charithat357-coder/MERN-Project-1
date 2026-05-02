import { useState, useEffect } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentDashboard = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const res = await api.get('/student/marks');
        setMarks(res.data);
      } catch (error) {
        console.error("Error fetching marks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Student Mid Marks Report', 14, 22);
    
    // Student Info
    doc.setFontSize(12);
    doc.text(`Name: ${user.name}`, 14, 32);
    doc.text(`Email: ${user.email}`, 14, 38);
    
    // Table
    const tableColumn = ["Subject Code", "Subject Name", "Mid 1", "Mid 2", "A1", "A2", "Final Internal"];
    const tableRows = [];

    marks.forEach(mark => {
      const markData = [
        mark.subject?.code,
        mark.subject?.name,
        mark.mid1,
        mark.mid2,
        mark.assignment1,
        mark.assignment2,
        mark.total
      ];
      tableRows.push(markData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] } // primary color
    });

    doc.save(`${user.name}_Marks_Report.pdf`);
  };

  if (loading) return <div className="p-8">Loading marks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Performance</h2>
          <p className="text-sm text-slate-500 mt-1">Mid marks calculation based on institution settings</p>
        </div>
        <button 
          onClick={downloadPDF}
          disabled={marks.length === 0}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Subject Code</th>
              <th className="p-4 font-semibold text-slate-700">Subject Name</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Mid 1</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Mid 2</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Assign 1</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Assign 2</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Status</th>
              <th className="p-4 font-semibold text-primary text-center">Final Internal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {marks.map((mark) => (
              <tr key={mark._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-sm font-medium text-slate-900">{mark.subject?.code}</td>
                <td className="p-4 text-sm text-slate-600">{mark.subject?.name}</td>
                <td className="p-4 text-sm text-center text-slate-600">{mark.mid1}</td>
                <td className="p-4 text-sm text-center text-slate-600">{mark.mid2}</td>
                <td className="p-4 text-sm text-center text-slate-600">{mark.assignment1}</td>
                <td className="p-4 text-sm text-center text-slate-600">{mark.assignment2}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    mark.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                    mark.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {mark.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg">
                    {mark.total}
                  </span>
                </td>
              </tr>
            ))}
            {marks.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No approved marks available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
