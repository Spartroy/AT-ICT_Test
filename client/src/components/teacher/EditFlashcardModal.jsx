import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const EditFlashcardModal = ({ isOpen, onClose, onSuccess, stack }) => {
  const [formData, setFormData] = useState({
    title: '',
    isPublic: true,
    cards: [{ front: '', back: '' }]
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stack) {
      setFormData({
        title: stack.title || '',
        isPublic: stack.isPublic !== false,
        cards: stack.cards?.length > 0 ? stack.cards : [{ front: '', back: '' }]
      });
    }
  }, [stack]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardChange = (index, field, value) => {
    setFormData(prev => {
      if (!prev || !prev.cards) {
        return {
          title: '',
          isPublic: true,
          cards: [{ front: '', back: '' }]
        };
      }
      return {
        ...prev,
        cards: prev.cards.map((card, i) => 
          i === index ? { ...card, [field]: value } : card
        )
      };
    });
  };

  const addCard = () => {
    setFormData(prev => {
      if (!prev || !prev.cards) {
        return {
          title: '',
          isPublic: true,
          cards: [{ front: '', back: '' }]
        };
      }
      return {
        ...prev,
        cards: [...prev.cards, { front: '', back: '' }]
      };
    });
  };

  const removeCard = (index) => {
    if (!formData.cards || formData.cards.length <= 1) {
      showWarning('At least one card is required');
      return;
    }
    setFormData(prev => {
      if (!prev || !prev.cards) {
        return {
          title: '',
          isPublic: true,
          cards: [{ front: '', back: '' }]
        };
      }
      return {
        ...prev,
        cards: prev.cards.filter((_, i) => i !== index)
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subject.trim()) {
      showWarning('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.FLASHCARDS}/${stack._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showSuccess('Flashcard stack updated successfully!');
        onSuccess();
      } else {
        const data = await response.json();
        showError(data.message || 'Failed to update flashcard stack');
      }
    } catch (error) {
      showError('Failed to update flashcard stack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                         <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80"
               onClick={onClose}
               style={{ zIndex: 40 }}
             />
                         <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-[#161616] border border-white/10 rounded-xl"
               style={{ zIndex: 50, position: 'relative' }}
               onClick={(e) => e.stopPropagation()}
             >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#CA133E]/20 rounded-xl">
                    <BookOpenIcon className="h-6 w-6 text-[#CA133E]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Edit Flashcard Stack
                    </h3>
                    <p className="text-sm text-gray-500">
                      Update your flashcard stack
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/8">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Stack Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 bg-[#1A1A1A] text-white placeholder-gray-600 rounded-xl focus:outline-none focus:border-[#CA133E] transition-colors"
                      placeholder="Enter stack title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Visibility
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.isPublic}
                          onChange={() => handleInputChange('isPublic', true)}
                          className="mr-2 accent-[#CA133E]"
                        />
                        <span className="text-sm text-gray-300">Public</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!formData.isPublic}
                          onChange={() => handleInputChange('isPublic', false)}
                          className="mr-2 accent-[#CA133E]"
                        />
                        <span className="text-sm text-gray-300">Private</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-white">
                      Flashcards ({formData.cards.length})
                    </h4>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={addCard}
                      className="flex items-center gap-2 px-4 py-2 bg-[#CA133E] text-white rounded-xl hover:bg-[#A01030] transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Card
                    </motion.button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {formData.cards.map((card, index) => (
                      <div key={index} className="border border-white/10 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-[#1A1A1A]">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white text-sm font-medium rounded-full">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-400">
                              Card {index + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCard(index)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Front *
                              </label>
                              <textarea
                                value={card.front}
                                onChange={(e) => handleCardChange(index, 'front', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-white/10 bg-[#1A1A1A] text-white placeholder-gray-600 rounded-xl focus:outline-none focus:border-[#CA133E] transition-colors"
                                placeholder="Question or prompt..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Back *
                              </label>
                              <textarea
                                value={card.back}
                                onChange={(e) => handleCardChange(index, 'back', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-white/10 bg-[#1A1A1A] text-white placeholder-gray-600 rounded-xl focus:outline-none focus:border-[#CA133E] transition-colors"
                                placeholder="Answer or explanation..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="BTN bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Stack'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditFlashcardModal; 