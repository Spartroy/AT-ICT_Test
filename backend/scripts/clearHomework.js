#!/usr/bin/env node
/**
 * Deletes ALL homework (assignments, with the submissions and grades stored inside them) and the activity-feed entries
 * about them, so the term can start fresh. Students, materials, videos, notes and everything else are left alone.
 *
 *   node backend/scripts/clearHomework.js          # dry run: shows what would be deleted
 *   node backend/scripts/clearHomework.js --yes    # really deletes
 *
 * It uses MONGO_URI from backend/.env (or the environment). This cannot be undone, so take a database backup first
 * (Atlas: Cluster > Backup, or `mongodump`). Files students uploaded as homework stay in uploads/homework/.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Activity = require('../models/Activity');

const confirmed = process.argv.includes('--yes');

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set (backend/.env or the environment).');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const { host, name } = mongoose.connection;
  console.log(`Database: ${name} on ${host}`);

  const assignments = await Assignment.countDocuments({});
  const activities = await Activity.countDocuments({ relatedItemModel: 'Assignment' });
  console.log(`Homework (assignments): ${assignments}`);
  console.log(`Activity-feed entries about homework: ${activities}`);

  if (!confirmed) {
    console.log('\nDry run, nothing was deleted. Run again with --yes to delete the above.');
  } else {
    const a = await Assignment.deleteMany({});
    const b = await Activity.deleteMany({ relatedItemModel: 'Assignment' });
    console.log(`\nDeleted ${a.deletedCount} assignment(s) and ${b.deletedCount} activity entr${b.deletedCount === 1 ? 'y' : 'ies'}.`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
