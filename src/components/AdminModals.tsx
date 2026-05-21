import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'time' | 'checkbox' | 'password' | 'select';
  options?: { label: string; value: string | number }[];
  required?: boolean;
}

interface GenericModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  onSubmit: (data: any) => Promise<void>;
}

export function GenericAdminModal({ isOpen, onClose, title, fields, onSubmit }: GenericModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
      setFormData({});
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-brand-bg border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] hide-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-bold text-white">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-brand-slate transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-brand-crimson/20 border border-brand-crimson/50 text-brand-crimson rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-xs uppercase tracking-widest text-brand-slate mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-crimson transition-colors"
                  >
                    <option value="" disabled>Select {field.label}</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-brand-bg">{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={formData[field.name] || false}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-crimson focus:ring-brand-crimson focus:ring-offset-brand-bg"
                    />
                    <span className="text-sm text-white">Yes</span>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-brand-crimson transition-colors"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-brand-slate hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
