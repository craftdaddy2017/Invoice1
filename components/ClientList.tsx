
import React, { useState, useEffect } from 'react';
import { Client, Address } from '../types';
import { INDIAN_STATES } from '../constants';

interface ClientListProps {
  clients: Client[];
  onSave: (client: Client) => void;
  onDelete: (id: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onSave, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const initialClient: Client = {
    id: `client-${Date.now()}`,
    name: '',
    email: '',
    gstin: '',
    pan: '',
    address: {
      street: '',
      city: '',
      state: 'Delhi',
      stateCode: '07',
      pincode: '',
      country: 'India'
    }
  };

  const [formData, setFormData] = useState<Client>(initialClient);

  // Auto-extract PAN from GSTIN
  useEffect(() => {
    if (formData.gstin && formData.gstin.length === 15) {
      const extractedPan = formData.gstin.substring(2, 12).toUpperCase();
      if (formData.pan !== extractedPan) {
        setFormData(prev => ({ ...prev, pan: extractedPan }));
      }
    }
  }, [formData.gstin]);

  const handleEdit = (client: Client) => {
    setFormData(client);
    setEditingClient(client);
    setShowForm(true);
  };

  const handleAdd = () => {
    setFormData({ ...initialClient, id: `client-${Date.now()}` });
    setEditingClient(null);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowForm(false);
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setFormData({
      ...formData,
      address: { ...formData.address, [field]: value }
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-gray-500">Manage your business customers</p>
        </div>
        {!showForm && (
          <button 
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
          >
            Add New Client
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-xl font-bold mb-6">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company / Client Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GSTIN (15 Digits)</label>
                <input 
                  type="text" 
                  maxLength={15}
                  placeholder="e.g. 07AAAAA0000A1Z1"
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  value={formData.gstin}
                  onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PAN (Auto-filled)</label>
                <input 
                  type="text" 
                  readOnly
                  placeholder="Extracted from GSTIN"
                  className="w-full p-2 border rounded-lg bg-gray-100 text-gray-600 outline-none cursor-not-allowed uppercase"
                  value={formData.pan}
                />
              </div>
              <div className="col-span-2 border-t pt-4 mt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.address.street}
                  onChange={e => updateAddress('street', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.address.city}
                  onChange={e => updateAddress('city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.address.stateCode}
                  onChange={e => {
                    const state = INDIAN_STATES.find(s => s.code === e.target.value);
                    if (state) {
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: state.name, stateCode: state.code }
                      });
                    }
                  }}
                >
                  {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pincode</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2 border rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.address.pincode}
                  onChange={e => updateAddress('pincode', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                {editingClient ? 'Update Client' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">GSTIN / PAN</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{client.email || 'No email provided'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{client.address.city}, {client.address.state}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs font-mono">
                    <div>G: {client.gstin || 'N/A'}</div>
                    <div className="text-gray-400">P: {client.pan || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(client)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">Edit</button>
                      <button onClick={() => onDelete(client.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium">No clients added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientList;
