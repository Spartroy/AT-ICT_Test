#!/usr/bin/env node
/**
 * Loads the past papers (QP, MS and source files for Papers 1, 2 and 3) from scripts/data/pastPapers.json into the
 * `pastpapers` collection, so they appear on the students' Past papers shelves.
 *
 *   node backend/scripts/seedPastPapers.js          # dry run: shows what would change
 *   node backend/scripts/seedPastPapers.js --yes    # really writes
 *
 * Like the teacher's "Save" in the portal, it REPLACES everything stored for each paper + year in the file
 * (years and papers that are not in the file are left alone). Safe to run again.
 * It uses MONGO_URI from backend/.env (or the environment); take a database backup first.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const PastPaper = require('../models/PastPaper');
const { normalizePastPapers } = require('../validators/pastPapers');
const entries = require('./data/pastPapers.json');

const confirmed = process.argv.includes('--yes');

(async () => {
  const batches = entries.map((entry) => {
    const { value, errors } = normalizePastPapers(entry);
    if (errors.length) throw new Error(`Paper ${entry.paper} ${entry.year}: ${errors[0].msg} (${errors[0].path})`);
    return value;
  });

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set (backend/.env or the environment).');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const { host, name } = mongoose.connection;
  console.log(`Database: ${name} on ${host}\n`);

  let replaced = 0;
  let written = 0;
  for (const { paper, year, docs } of batches) {
    const existing = await PastPaper.countDocuments({ paper, year });
    replaced += existing;
    written += docs.length;
    console.log(`Paper ${paper} ${year}: ${docs.length} variant(s)${existing ? `, replacing ${existing} stored` : ''}`);
    if (confirmed) {
      await PastPaper.deleteMany({ paper, year });
      if (docs.length) await PastPaper.insertMany(docs);
    }
  }

  console.log(`\n${confirmed ? 'Wrote' : 'Would write'} ${written} variant(s) across ${batches.length} paper-years (${replaced} existing replaced).`);
  if (!confirmed) console.log('Dry run, nothing was changed. Run again with --yes to apply.');
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
