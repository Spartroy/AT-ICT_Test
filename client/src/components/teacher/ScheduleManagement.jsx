import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ScheduleManager from './ScheduleManager';
import ScheduleBuilder from './ScheduleBuilder';

const ScheduleManagement = () => {
  const [activeView, setActiveView] = useState('manager'); // 'manager' or 'builder'

  const views = [
    { 
      id: 'manager', 
      label: 'Multiple Schedules', 
      description: 'Create and manage multiple schedules for different student groups',
      icon: '📅'
    },
    { 
      id: 'builder', 
      label: 'Single Schedule', 
      description: 'Edit the main schedule for all students',
      icon: '⚙️'
    }
  ];

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="bg-white/10 rounded-xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Schedule Management</h2>
        <p className="text-gray-400 mb-6">Choose how you want to manage schedules</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {views.map((view) => (
            <motion.button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                activeView === view.id
                  ? 'border-[#CA133E] bg-[#CA133E]/20'
                  : 'border-white/20 bg-white/10 hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{view.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{view.label}</h3>
                  <p className="text-gray-400 text-sm">{view.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Active View Content */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'manager' ? (
          <ScheduleManager />
        ) : (
          <ScheduleBuilder />
        )}
      </motion.div>
    </div>
  );
};

export default ScheduleManagement;
