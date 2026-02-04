import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { Invoice, Lead, InvoiceStatus } from '../types';
import { formatCurrency } from '../services/Calculations';

interface DashboardProps {
  invoices: Invoice[];
  leads: Lead[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices = [], leads = [] }) => {
  const calculateTotal = (inv: Invoice) => 
    (inv.items || []).reduce((sum, item) => sum + (item.qty * item.rate * (1 + item.taxRate / 100)), 0);

  const totalRevenue = invoices
    .filter(inv => inv.status === InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + calculateTotal(inv), 0);

  const outstanding = invoices
    .filter(inv => inv.status !== InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + calculateTotal(inv), 0);

  const leadValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);

  const chartData = [
    { name: 'Jan', sales: 45000 },
    { name: 'Feb', sales: 52000 },
    { name: 'Mar', sales: 48000 },
    { name: 'Apr', sales: 61000 },
    { name: 'May', sales: totalRevenue || 0 },
  ];

  const pieData = [
    { name: 'New', value: leads.filter(l => l.status === 'New').length },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Proposal', value: leads.filter(l => l.status === 'Proposal').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe'];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Business Insights</h1>
        <p className="text-gray-500 text-sm">Real-time performance of {invoices.length} invoices and {leads.length} leads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-indigo-500 transition">Total Paid Revenue</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">{formatCurrency(totalRevenue)}</p>
          <div className="mt-4 h-1 w-full bg-indigo-50 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 w-[70%]"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-orange-500 transition">Outstanding Receivables</p>
          <p className="text-3xl font-black text-orange-500 mt-2">{formatCurrency(outstanding)}</p>
          <div className="mt-4 h-1 w-full bg-orange-50 rounded-full overflow-hidden">
             <div className="h-full bg-orange-500 w-[40%]"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-emerald-500 transition">Sales Pipeline</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">{formatCurrency(leadValue)}</p>
          <div className="mt-4 h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 w-[55%]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-8 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
            Monthly Sales Trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-8 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Lead Analytics
          </h2>
          <div className="h-72 flex items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-4 ml-8">
                   {pieData.map((d, i) => (
                     <div key={d.name} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{d.name}</span>
                        </div>
                        <span className="text-xl font-black text-gray-800 ml-4">{d.value}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
              <div className="text-gray-300 text-sm font-medium italic">No lead data to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;