import React, { useState, useMemo } from 'react';
import { 
  Invoice, 
  Client, 
  UserBusinessProfile, 
  LineItem, 
  InvoiceStatus,
  BankAccount
} from '../types';
import { INDIAN_STATES, CRAFT_DADDY_LOGO_SVG } from '../constants';
import { calculateLineItem, formatCurrency, numberToWords } from '../services/Calculations';
import { suggestLineItemsFromPrompt } from '../services/geminiService';

interface InvoiceFormProps {
  userProfile: UserBusinessProfile;
  clients: Client[];
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  initialData?: Invoice;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ userProfile, clients, onSave, onCancel, initialData }) => {
  const [invoice, setInvoice] = useState<Invoice>(() => {
    if (initialData) {
      return {
        ...initialData,
        bankDetails: initialData.bankDetails || userProfile.bankAccounts[0]
      };
    }
    return {
      id: `inv-${Date.now()}`,
      number: `CD${new Date().getFullYear()}${Math.floor(Math.random() * 9999)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      poNumber: '15300',
      status: InvoiceStatus.DRAFT,
      clientId: clients[0]?.id || '',
      items: [{ id: '1', description: 'REFLECTIVE JACKET', hsn: '6210', qty: 225, rate: 100, taxRate: 5 }],
      placeOfSupply: 'Delhi (07)',
      bankDetails: userProfile.bankAccounts[0],
      notes: 'Thank you for your business!',
      terms: '1. For questions concerning this invoice, please contact Email Address : sales@craftdaddy.in\n2. All the dispute are subject to delhi jurisdiction only'
    };
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const selectedClient = useMemo(() => clients.find(c => c.id === invoice.clientId), [clients, invoice.clientId]);
  
  const isInterState = useMemo(() => {
    const supplyStateCode = invoice.placeOfSupply.match(/\((\d+)\)/)?.[1];
    return supplyStateCode !== userProfile.address.stateCode;
  }, [invoice.placeOfSupply, userProfile.address.stateCode]);

  const totals = useMemo(() => {
    return (invoice.items || []).reduce((acc, item) => {
      const calc = calculateLineItem(item, isInterState);
      return {
        taxable: acc.taxable + calc.taxableValue,
        cgst: acc.cgst + calc.cgst,
        sgst: acc.sgst + calc.sgst,
        igst: acc.igst + calc.igst,
        total: acc.total + calc.total
      };
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  }, [invoice.items, isInterState]);

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }]
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) return;
    setInvoice(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const suggested = await suggestLineItemsFromPrompt(aiPrompt);
    const mapped = suggested.map((s: any) => ({ ...s, id: Math.random().toString(36).slice(2, 11) }));
    setInvoice(prev => ({ ...prev, items: [...prev.items, ...mapped] }));
    setAiPrompt('');
    setIsAiLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-100 relative">
      {/* LEFT: EDITOR PANEL */}
      <div className="w-full lg:w-1/3 bg-white border-r border-gray-200 h-full overflow-y-auto no-print z-10 flex flex-col">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-20 flex justify-between items-center">
           <h1 className="text-xl font-bold text-gray-800">Invoice Editor</h1>
           <div className="flex gap-2">
              <button onClick={onCancel} className="text-xs text-gray-500 hover:underline">Cancel</button>
              <button onClick={() => onSave(invoice)} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold transition hover:bg-indigo-700">Save Invoice</button>
           </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
             <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider border-b pb-1">Basic Info</h2>
             <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Client</label>
                  <select 
                    className="w-full p-2 border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 text-gray-900"
                    value={invoice.clientId}
                    onChange={(e) => setInvoice({...invoice, clientId: e.target.value})}
                  >
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">Invoice No</label>
                   <input 
                    type="text" 
                    className="w-full p-2 border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 text-gray-900" 
                    value={invoice.number} 
                    onChange={e => setInvoice({...invoice, number: e.target.value})} 
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">P.O. Number</label>
                   <input 
                    type="text" 
                    className="w-full p-2 border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 text-gray-900" 
                    value={invoice.poNumber} 
                    onChange={e => setInvoice({...invoice, poNumber: e.target.value})} 
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">Date</label>
                   <input 
                    type="date" 
                    className="w-full p-2 border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 text-gray-900" 
                    value={invoice.date} 
                    onChange={e => setInvoice({...invoice, date: e.target.value})} 
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">Place of Supply</label>
                   <select 
                    className="w-full p-2 border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 text-gray-900" 
                    value={invoice.placeOfSupply} 
                    onChange={e => setInvoice({...invoice, placeOfSupply: e.target.value})}
                   >
                     {INDIAN_STATES.map(s => <option key={s.code} value={`${s.name} (${s.code})`}>{s.name} ({s.code})</option>)}
                   </select>
                </div>
             </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
             <h3 className="text-xs font-bold text-indigo-700 uppercase">AI Item Builder</h3>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 p-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white text-gray-900" 
                  placeholder="e.g. 225 jackets @ 100 each"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
                <button 
                  onClick={handleAiSuggest}
                  disabled={isAiLoading}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition hover:bg-indigo-700"
                >
                  {isAiLoading ? '...' : 'Magic'}
                </button>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Items</h2>
                <button onClick={addItem} className="text-indigo-600 text-xs font-bold hover:underline transition">+ Add Item</button>
             </div>
             {invoice.items.map((item, idx) => (
               <div key={item.id} className="p-3 border rounded-lg bg-white relative group shadow-sm transition-shadow hover:shadow-md">
                  <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <label className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">Description</label>
                  <input 
                    type="text" 
                    placeholder="Item name"
                    className="w-full text-sm font-bold border border-gray-100 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none mb-3 bg-gray-50 text-gray-900"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                  />
                  <div className="mb-3">
                    <label className="text-[9px] uppercase font-bold text-gray-400 mb-1 block">HSN/SAC Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 6210"
                      className="w-full text-sm font-medium border border-gray-100 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 text-gray-900"
                      value={item.hsn}
                      onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">Rate</label>
                      <input 
                        type="number" 
                        className="w-full p-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 text-gray-900" 
                        value={item.rate} 
                        onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value))} 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">Qty</label>
                      <input 
                        type="number" 
                        className="w-full p-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 text-gray-900" 
                        value={item.qty} 
                        onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))} 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] uppercase font-bold text-gray-400">GST %</label>
                      <select 
                        className="w-full p-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 text-gray-900" 
                        value={item.taxRate} 
                        onChange={e => updateItem(item.id, 'taxRate', parseInt(e.target.value))}
                      >
                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <button 
              onClick={handlePrint}
              className="w-full bg-indigo-900 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition hover:bg-indigo-950"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
               Download PDF / Print
            </button>
        </div>
      </div>

      {/* RIGHT: LIVE PREVIEW AREA */}
      <div className="flex-1 bg-[#f0f0f7] overflow-y-auto p-4 lg:p-12 flex justify-center items-start print-view-container">
        <div id="invoice-sheet" className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[10mm] flex flex-col font-sans text-gray-900 overflow-hidden relative border border-gray-200 box-border">
          
          <div className="flex justify-between items-start mb-8">
            <div className="w-1/2">
               <h1 className="text-4xl font-normal text-[#6338af] mb-4 text-left">Tax Invoice</h1>
               <div className="space-y-1 text-xs">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Invoice No #</span>
                    <span className="font-bold text-gray-900">{invoice.number}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">Invoice Date</span>
                    <span className="font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">P.O. Number</span>
                    <span className="font-bold text-gray-900">{invoice.poNumber || '---'}</span>
                  </div>
               </div>
            </div>
            <div className="w-1/2 flex justify-end items-start pt-2 min-h-[100px]">
               <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-h-24 w-auto object-contain block" alt="Craft Daddy Logo" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#f3f0ff] p-4 rounded-lg billed-section">
               <h3 className="text-[#6338af] text-sm font-bold mb-2">Billed By</h3>
               <div className="text-[11px] leading-relaxed">
                  <p className="font-bold text-gray-900">{userProfile.companyName}</p>
                  <p className="text-gray-600">{userProfile.address.street}, {userProfile.address.city},</p>
                  <p className="text-gray-600">{userProfile.address.state}, India - {userProfile.address.pincode}</p>
                  <p className="mt-1"><span className="font-bold">GSTIN:</span> {userProfile.gstin}</p>
               </div>
            </div>
            <div className="bg-[#f3f0ff] p-4 rounded-lg billed-section">
               <h3 className="text-[#6338af] text-sm font-bold mb-2">Billed To</h3>
               <div className="text-[11px] leading-relaxed">
                  <p className="font-bold text-gray-900 uppercase">{selectedClient?.name || '---'}</p>
                  <p className="text-gray-600">{selectedClient?.address.street || '---'}</p>
                  <p className="text-gray-600">{selectedClient?.address.city || ''}, {selectedClient?.address.state || ''}, {selectedClient?.address.pincode || ''}</p>
                  <p className="mt-1"><span className="font-bold">GSTIN:</span> {selectedClient?.gstin || 'Unregistered'}</p>
               </div>
            </div>
          </div>

          <div className="flex justify-between text-[11px] mb-4 text-gray-600 px-1">
             <div><span className="font-bold text-gray-900">Country of Supply:</span> India</div>
             <div><span className="font-bold text-gray-900">Place of Supply:</span> {invoice.placeOfSupply}</div>
          </div>

          <div className="mb-6 flex-1">
             <table className="w-full text-left border-collapse table-fixed">
                <thead>
                   <tr className="bg-[#6338af] text-white">
                      <th className="py-2 pl-4 text-[9px] font-bold uppercase w-[25%]">Item</th>
                      <th className="py-2 text-center text-[9px] font-bold uppercase w-[10%]">GST</th>
                      <th className="py-2 text-center text-[9px] font-bold uppercase w-[8%]">Qty</th>
                      <th className="py-2 text-center text-[9px] font-bold uppercase w-[12%]">Rate</th>
                      <th className="py-2 text-right text-[9px] font-bold uppercase w-[12%]">Amount</th>
                      {isInterState ? (
                        <th className="py-2 text-right text-[9px] font-bold uppercase w-[12%]">IGST</th>
                      ) : (
                        <>
                          <th className="py-2 text-right text-[9px] font-bold uppercase w-[10%]">CGST</th>
                          <th className="py-2 text-right text-[9px] font-bold uppercase w-[10%]">SGST</th>
                        </>
                      )}
                      <th className="py-2 pr-4 text-right text-[9px] font-bold uppercase w-[14%]">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {(invoice.items || []).map((item, idx) => {
                     const calc = calculateLineItem(item, isInterState);
                     return (
                        <tr key={item.id} className="text-[10px] text-gray-700 bg-gray-50/20">
                           <td className="py-3 pl-4 font-medium break-words leading-tight">{idx + 1}. {item.description} {item.hsn ? `(HSN/SAC: ${item.hsn})` : ''}</td>
                           <td className="py-3 text-center whitespace-nowrap">{item.taxRate}%</td>
                           <td className="py-3 text-center whitespace-nowrap">{item.qty}</td>
                           <td className="py-3 text-center whitespace-nowrap">₹{item.rate.toLocaleString('en-IN')}</td>
                           <td className="py-3 text-right whitespace-nowrap">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                           {isInterState ? (
                             <td className="py-3 text-right whitespace-nowrap">₹{calc.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                           ) : (
                             <>
                               <td className="py-3 text-right whitespace-nowrap">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                               <td className="py-3 text-right whitespace-nowrap">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                             </>
                           )}
                           <td className="py-3 pr-4 text-right font-bold whitespace-nowrap">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>

          <div className="flex justify-between items-start mb-8 gap-4">
             <div className="w-[60%]">
                <p className="text-[11px] leading-relaxed"><span className="font-bold">Total (in words) :</span> <span className="uppercase font-bold text-gray-900">{numberToWords(Math.round(totals.total))}</span></p>
                <div className="mt-8 bg-[#f3f0ff] p-4 rounded-lg w-full bank-details-box">
                   <h4 className="text-[#6338af] text-sm font-bold mb-3">Bank Details</h4>
                   <div className="grid grid-cols-[110px_1fr] gap-y-1 text-[11px]">
                      <div className="text-gray-500 font-bold">Account Name</div>
                      <div className="font-bold text-gray-900 uppercase">{invoice.bankDetails?.accountName || '---'}</div>
                      <div className="text-gray-500 font-bold">Account Number</div>
                      <div className="font-bold text-gray-900">{invoice.bankDetails?.accountNumber || '---'}</div>
                      <div className="text-gray-500 font-bold">IFSC</div>
                      <div className="font-bold text-gray-900 uppercase">{invoice.bankDetails?.ifscCode || '---'}</div>
                      <div className="text-gray-500 font-bold">Bank</div>
                      <div className="font-bold text-gray-900 uppercase">{invoice.bankDetails?.bankName || '---'}</div>
                   </div>
                </div>
             </div>
             
             <div className="w-[35%] space-y-3">
                <div className="grid grid-cols-2 text-[11px] text-gray-700">
                   <div className="font-bold">Amount</div>
                   <div className="text-right whitespace-nowrap">₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                   
                   {isInterState ? (
                     <>
                       <div className="font-bold mt-1">IGST</div>
                       <div className="text-right mt-1 whitespace-nowrap">₹{totals.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                     </>
                   ) : (
                     <>
                       <div className="font-bold mt-1">CGST</div>
                       <div className="text-right mt-1 whitespace-nowrap">₹{totals.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                       <div className="font-bold mt-1">SGST</div>
                       <div className="text-right mt-1 whitespace-nowrap">₹{totals.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                     </>
                   )}
                </div>
                
                <div className="pt-2 border-t border-b border-gray-900/30">
                  <div className="flex justify-between items-center py-2">
                     <span className="text-base font-bold text-gray-900">Total (INR)</span>
                     <span className="text-lg font-bold text-gray-900 whitespace-nowrap">₹{totals.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
                <div className="h-px bg-gray-900 -mt-1 w-full"></div>
             </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100">
             <h4 className="text-[#6338af] text-sm font-bold mb-2">Terms and Conditions</h4>
             <ol className="text-[10px] text-gray-600 space-y-1">
                {invoice.terms?.split('\n').map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
             </ol>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          #root { display: block !important; }
          .no-print { display: none !important; }
          
          .print-view-container { 
            background: transparent !important; 
            padding: 0 !important;
            display: block !important;
            overflow: visible !important;
            width: 100% !important;
          }

          #invoice-sheet {
            display: flex !important;
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 5mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            z-index: 9999 !important;
            box-sizing: border-box !important;
          }

          /* Force exact colors for print */
          .bg-\\[\\#6338af\\] { background-color: #6338af !important; -webkit-print-color-adjust: exact; }
          .text-\\[\\#6338af\\] { color: #6338af !important; -webkit-print-color-adjust: exact; }
          .bg-\\[\\#f3f0ff\\] { background-color: #f3f0ff !important; -webkit-print-color-adjust: exact; }
          
          /* Prevent page breaks inside critical elements */
          .billed-section, .bank-details-box, tr {
            page-break-inside: avoid !important;
          }
        }
      `}} />
    </div>
  );
};

export default InvoiceForm;