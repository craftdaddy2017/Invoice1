
import React, { useState, useMemo } from 'react';
import { 
  Invoice, 
  Client, 
  UserBusinessProfile, 
  LineItem, 
  InvoiceStatus,
  BankAccount
} from '../types';
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
  // Use a functional initializer for state to ensure bankDetails is always present even if missing in initialData
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
      status: InvoiceStatus.DRAFT,
      clientId: clients[0]?.id || '',
      items: [{ id: '1', description: 'Sample Service', hsn: '9983', qty: 1, rate: 0, taxRate: 18 }],
      placeOfSupply: 'Delhi (07)',
      bankDetails: userProfile.bankAccounts[0],
      notes: 'Thank you for your business!',
      terms: '1. Subject to Delhi jurisdiction only.\n2. Payment within due date.'
    };
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(userProfile.logoUrl || null);

  const selectedClient = useMemo(() => clients.find(c => c.id === invoice.clientId), [clients, invoice.clientId]);
  const isInterState = useMemo(() => {
    if (!selectedClient) return false;
    return selectedClient.address.stateCode !== userProfile.address.stateCode;
  }, [selectedClient, userProfile.address.stateCode]);

  const totals = useMemo(() => {
    return invoice.items.reduce((acc, item) => {
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
    const mapped = suggested.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
    setInvoice(prev => ({ ...prev, items: [...prev.items, ...mapped] }));
    setAiPrompt('');
    setIsAiLoading(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => setLogoUrl(loadEvent.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-100 no-print-wrapper">
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
          {/* Logo Upload */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Branding</h2>
            <label className="block w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition">
               <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
               <span className="text-xs text-gray-500 font-medium">{logoUrl ? 'Logo Uploaded - Click to Change' : 'Click to upload company logo'}</span>
            </label>
          </div>

          {/* Details */}
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
                   <label className="block text-[10px] font-bold text-gray-500 uppercase">Date</label>
                   <input 
                    type="date" 
                    className="w-full p-2 border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 text-gray-900" 
                    value={invoice.date} 
                    onChange={e => setInvoice({...invoice, date: e.target.value})} 
                   />
                </div>
             </div>
          </div>

          {/* AI Helper */}
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
             <h3 className="text-xs font-bold text-indigo-700 uppercase">AI Item Builder</h3>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 p-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white text-gray-900" 
                  placeholder="e.g. 5 hours of design work"
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

          {/* Items List */}
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
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <label className="text-[9px] uppercase font-bold text-gray-400">HSN/SAC Code</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9983"
                        className="w-full p-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 text-gray-900" 
                        value={item.hsn} 
                        onChange={e => updateItem(item.id, 'hsn', e.target.value)} 
                      />
                    </div>
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

          {/* Bank Selection */}
          <div className="space-y-4">
             <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider border-b pb-1">Select Bank Account</h2>
             <select 
               className="w-full p-2 border border-gray-200 rounded text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-gray-50 text-gray-900"
               value={invoice.bankDetails?.accountNumber}
               onChange={(e) => setInvoice({...invoice, bankDetails: userProfile.bankAccounts.find(b => b.accountNumber === e.target.value)})}
             >
               {userProfile.bankAccounts.map(b => <option key={b.accountNumber} value={b.accountNumber}>{b.bankName} - {b.accountNumber}</option>)}
             </select>
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
      <div className="flex-1 bg-[#f0f0f7] overflow-y-auto p-4 lg:p-12 flex justify-center items-start no-print">
        <div id="invoice-sheet" className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[10mm] flex flex-col font-sans text-gray-900 overflow-hidden relative border border-gray-200">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div className="w-1/2">
               <h1 className="text-4xl font-light text-[#5c2c90] tracking-wide mb-6">Tax Invoice</h1>
               <div className="space-y-1 text-sm">
                  <p><span className="text-gray-400 inline-block w-24">Invoice No #</span> <span className="font-bold">{invoice.number}</span></p>
                  <p><span className="text-gray-400 inline-block w-24">Invoice Date</span> <span className="font-bold">{new Date(invoice.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</span></p>
                  <p><span className="text-gray-400 inline-block w-24">Place of Supply</span> <span className="font-bold">{invoice.placeOfSupply}</span></p>
               </div>
            </div>
            <div className="w-1/2 flex justify-end">
               {logoUrl ? (
                 <img src={logoUrl} className="max-h-20 object-contain" alt="Logo" />
               ) : (
                 <div className="text-4xl font-bold text-[#5c2c90] tracking-tighter" style={{ fontFamily: 'serif' }}>
                    {userProfile.companyName}<span className="text-sm align-top">®</span>
                 </div>
               )}
            </div>
          </div>

          {/* Address Grid */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-[#f3e8ff] p-4 rounded-lg">
               <h3 className="text-[#5c2c90] text-lg font-medium mb-1 text-opacity-80">Billed By</h3>
               <p className="font-bold text-gray-800 text-sm mb-1">{userProfile.companyName}</p>
               <p className="text-xs text-gray-600 leading-relaxed mb-2">{userProfile.address.street}, {userProfile.address.city}, {userProfile.address.state} - {userProfile.address.pincode}</p>
               <div className="text-xs text-gray-500 font-medium space-y-0.5">
                  <p>GSTIN: <span className="text-gray-800">{userProfile.gstin}</span></p>
                  <p>PAN: <span className="text-gray-800">{userProfile.pan}</span></p>
               </div>
            </div>
            <div className="bg-[#f3e8ff] p-4 rounded-lg">
               <h3 className="text-[#5c2c90] text-lg font-medium mb-1 text-opacity-80">Billed To</h3>
               <p className="font-bold text-gray-800 text-sm mb-1">{selectedClient?.name || '---'}</p>
               <p className="text-xs text-gray-600 leading-relaxed mb-2">
                 {selectedClient?.address.street}, {selectedClient?.address.city}, {selectedClient?.address.state} - {selectedClient?.address.pincode}
               </p>
               <div className="text-xs text-gray-500 font-medium space-y-0.5">
                  <p>GSTIN: <span className="text-gray-800">{selectedClient?.gstin || 'Unregistered'}</span></p>
                  <p>PAN: <span className="text-gray-800">{selectedClient?.pan || '---'}</span></p>
               </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-10 flex-1">
             <table className="w-full">
                <thead>
                   <tr className="bg-[#5c2c90] text-white">
                      <th className="py-2.5 pl-4 text-left text-xs font-normal rounded-l-md w-[40%]">Item</th>
                      <th className="py-2.5 text-right text-xs font-normal">GST Rate</th>
                      <th className="py-2.5 text-right text-xs font-normal">Quantity</th>
                      <th className="py-2.5 text-right text-xs font-normal">Rate</th>
                      <th className="py-2.5 text-right text-xs font-normal">Amount</th>
                      {isInterState ? (
                        <th className="py-2.5 text-right text-xs font-normal">IGST</th>
                      ) : (
                        <>
                          <th className="py-2.5 text-right text-xs font-normal">CGST</th>
                          <th className="py-2.5 text-right text-xs font-normal">SGST</th>
                        </>
                      )}
                      <th className="py-2.5 pr-4 text-right text-xs font-normal rounded-r-md">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-gray-50/30">
                   {invoice.items.map((item, idx) => {
                     const calc = calculateLineItem(item, isInterState);
                     return (
                        <tr key={item.id} className="text-[11px] text-gray-700">
                           <td className="py-3 pl-4 font-medium">
                              {idx + 1}. {item.description || 'No Description'}
                              {item.hsn && <span className="text-gray-400 ml-1 text-[10px] italic">(HSN/SAC: {item.hsn})</span>}
                           </td>
                           <td className="py-3 text-right">{item.taxRate}%</td>
                           <td className="py-3 text-right">{item.qty}</td>
                           <td className="py-3 text-right">₹{item.rate.toLocaleString('en-IN')}</td>
                           <td className="py-3 text-right">₹{calc.taxableValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                           {isInterState ? (
                             <td className="py-3 text-right">₹{calc.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                           ) : (
                             <>
                               <td className="py-3 text-right">₹{calc.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                               <td className="py-3 text-right">₹{calc.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                             </>
                           )}
                           <td className="py-3 pr-4 text-right font-bold text-gray-900">₹{calc.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>

          {/* Footer Totals & Bank Details */}
          <div className="flex justify-between items-start mb-12 border-t pt-8">
             <div className="w-1/2 pr-6">
                <p className="text-[11px] font-bold text-gray-800 mb-4">
                  Total (in words) : <span className="uppercase text-[#5c2c90] font-medium">{numberToWords(Math.round(totals.total))}</span>
                </p>
                
                {/* Bank Details Table-like layout for precise replication */}
                <div className="bg-[#f3e8ff] p-4 rounded-lg">
                   <h4 className="text-[#5c2c90] text-sm font-bold mb-3 uppercase tracking-tight">Bank Details</h4>
                   <div className="grid grid-cols-[100px_1fr] gap-y-1.5 text-[11px] text-gray-700 font-medium">
                      <div className="text-gray-400">Account Name</div>
                      <div className="font-bold uppercase">{invoice.bankDetails?.accountName || '---'}</div>
                      
                      <div className="text-gray-400">Account Number</div>
                      <div className="font-bold">{invoice.bankDetails?.accountNumber || '---'}</div>
                      
                      <div className="text-gray-400">IFSC</div>
                      <div className="font-bold">{invoice.bankDetails?.ifscCode || '---'}</div>
                      
                      <div className="text-gray-400">Account Type</div>
                      <div className="font-bold">{invoice.bankDetails?.accountType || 'Current'}</div>
                      
                      <div className="text-gray-400">Bank</div>
                      <div className="font-bold uppercase">{invoice.bankDetails?.bankName || '---'}</div>
                   </div>
                </div>
             </div>
             
             <div className="w-[30%] space-y-3">
                <div className="flex justify-between text-xs text-gray-500">
                   <span>Amount</span>
                   <span className="font-medium text-gray-900">₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                {isInterState ? (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>IGST</span>
                    <span className="font-medium text-gray-900">₹{totals.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>CGST</span>
                      <span className="font-medium text-gray-900">₹{totals.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>SGST</span>
                      <span className="font-medium text-gray-900">₹{totals.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                  </>
                )}
                <div className="pt-3 border-t-2 border-gray-900 flex justify-between items-center">
                   <span className="font-bold text-sm">Total (INR)</span>
                   <span className="text-xl font-black text-[#5c2c90]">₹{totals.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
             </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-auto pt-8 flex flex-col gap-6 border-t border-gray-100">
             <div className="text-[11px] text-gray-400">
                <p className="font-bold text-gray-600 mb-1">Terms and Conditions</p>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {invoice.terms || `1. For questions concerning this invoice, please contact Email Address : sales@${userProfile.companyName.toLowerCase().replace(/\s/g, '')}.in\n2. All the dispute are subject to delhi jurisdiction only`}
                </div>
             </div>
             <div className="flex justify-between items-end opacity-40">
                <p className="text-[10px] italic">This is an electronically generated document, no signature is required.</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400">Powered by</span>
                  <span className="text-xs font-black text-[#5c2c90]">BOS-Cloud</span>
                </div>
             </div>
          </div>

        </div>
      </div>
      
      {/* IMPROVED PRINT STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
          }
          #root { display: none !important; }
          .no-print, .no-print-wrapper > * { display: none !important; }
          #invoice-sheet {
            display: flex !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default InvoiceForm;
