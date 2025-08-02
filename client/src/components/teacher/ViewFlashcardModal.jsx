import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_ENDPOINTS from '../../config/api';
import { showSuccess, showError } from '../../utils/toast';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

// Sound effects
const playFlipSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Ignore errors if audio fails
};

const playShuffleSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  audio.volume = 0.2;
  audio.play().catch(() => {}); // Ignore errors if audio fails
};

const ViewFlashcardModal = ({ isOpen, onClose, stack }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState([]);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    if (stack && stack.cards) {
      setCards([...stack.cards]);
    }
  }, [stack]);

  const handleCardClick = () => {
    playFlipSound();
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const shuffleCards = async () => {
    playShuffleSound();
    setIsShuffling(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    
    // Create a shuffled copy of cards
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    
    // Add a small delay for shuffle animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCards(shuffled);
    setIsShuffling(false);
    showSuccess('Cards shuffled!');
  };

  const currentCard = cards[currentCardIndex];

  if (!stack || !currentCard) {
    return null;
  }

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
                             {/* Header */}
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-100 rounded-xl">
                     <BookOpenIcon className="h-6 w-6 text-red-600" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-gray-900">
                       {stack.title}
                     </h3>
                     <p className="text-sm text-gray-600">
                       {stack.subject} • {stack.totalCards} cards
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={shuffleCards}
                     disabled={isShuffling}
                     className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                     title="Shuffle Cards"
                   >
                     {isShuffling ? (
                       <motion.div
                         animate={{ rotate: 360 }}
                         transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                       >
                         <ArrowPathIcon className="h-4 w-4" />
                       </motion.div>
                     ) : (
                       <ArrowPathIcon className="h-4 w-4" />
                     )}
                   </motion.button>
                   <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                     <XMarkIcon className="h-6 w-6" />
                   </button>
                 </div>
               </div>

                             {/* Stack Info */}
               <div className="bg-gray-50 rounded-xl p-4 mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                   <div className="flex items-center gap-2">
                     <AcademicCapIcon className="h-4 w-4 text-red-600" />
                     <span>By {stack.creatorName}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <BookOpenIcon className="h-4 w-4 text-blue-600" />
                     <span>{stack.totalCards} cards</span>
                   </div>
                 </div>
                 {stack.description && (
                   <p className="text-sm text-gray-600 mt-3">{stack.description}</p>
                 )}
               </div>

               

                                            {/* Flashcard */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-full max-w-md h-64 flashcard-container">
                    <motion.div
                      className="absolute inset-0 cursor-pointer flashcard"
                      whileHover={{ scale: 1.02 }}
                      onClick={handleCardClick}
                      animate={{ 
                        rotateY: isFlipped ? 180 : 0,
                        rotateX: isShuffling ? [0, 15, -15, 0] : 0,
                        scale: isShuffling ? [1, 1.15, 1] : 1
                      }}
                                             transition={{ 
                         duration: isShuffling ? 0.5 : 0.3, 
                         type: isShuffling ? "tween" : "spring", 
                         stiffness: 400, 
                         damping: 25,
                         ease: isShuffling ? "easeInOut" : "linear"
                       }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                                           {/* Front of card */}
                      <div className="absolute inset-0 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 flex items-center justify-center text-center flashcard-front"
                      style={{ backfaceVisibility: 'hidden' }}>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Card {currentCardIndex + 1}
                          </h4>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {currentCard.front}
                          </p>
                          <p className="text-sm text-gray-500 mt-4">
                            Click to flip
                          </p>
                        </div>
                      </div>

                      {/* Back of card */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl shadow-lg p-6 flex items-center justify-center text-center flashcard-back"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Answer
                          </h4>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {currentCard.back}
                          </p>
                          <p className="text-sm text-gray-500 mt-4">
                            Click to flip back
                          </p>
                        </div>
                      </div>
                   </motion.div>
                 </div>
               </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevCard}
                  disabled={currentCardIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  Previous
                </motion.button>

                                 <div className="text-sm text-gray-600">
                   {currentCardIndex + 1} of {cards.length}
                 </div>

                                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={nextCard}
                   disabled={currentCardIndex === cards.length - 1}
                   className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   Next
                   <ChevronRightIcon className="h-5 w-5" />
                 </motion.button>
               </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ViewFlashcardModal; 