import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_ENDPOINTS from '../../config/api';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const CreateFlashcardModal = ({ isOpen, onClose, onSuccess }) => {
                const [formData, setFormData] = useState({
                title: '',
                isPublic: true,
                cards: [{ front: '', back: '' }]
              });

  const [loading, setLoading] = useState(false);

  

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
    if (!formData.title.trim()) {
      showWarning('Please enter a stack title');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.FLASHCARDS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showSuccess('Flashcard stack created successfully!');
        onSuccess();
        resetForm();
      } else {
        const data = await response.json();
        showError(data.message || 'Failed to create flashcard stack');
      }
    } catch (error) {
      showError('Failed to create flashcard stack');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      isPublic: true,
      cards: [{ front: '', back: '' }]
    });
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
               className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
               onClick={onClose}
               style={{ zIndex: 40 }}
             />
                         <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl"
               style={{ zIndex: 50, position: 'relative' }}
               onClick={(e) => e.stopPropagation()}
             >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <BookOpenIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Create Flashcard Stack
                    </h3>
                    <p className="text-sm text-gray-600">
                      Create a new set of flashcards for your students
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stack Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter stack title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visibility
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={formData.isPublic}
                          onChange={() => handleInputChange('isPublic', true)}
                          className="mr-2 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">Public</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!formData.isPublic}
                          onChange={() => handleInputChange('isPublic', false)}
                          className="mr-2 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">Private</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Flashcards ({formData.cards.length})
                    </h4>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={addCard}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Card
                    </motion.button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {formData.cards.map((card, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white text-sm font-medium rounded-full">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              Card {index + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCard(index)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Front *
                              </label>
                              <textarea
                                value={card.front}
                                onChange={(e) => handleCardChange(index, 'front', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Question or prompt..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Back *
                              </label>
                              <textarea
                                value={card.back}
                                onChange={(e) => handleCardChange(index, 'back', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Answer or explanation..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-black font-bold bg-red-400 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Stack'}
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

export default CreateFlashcardModal; 