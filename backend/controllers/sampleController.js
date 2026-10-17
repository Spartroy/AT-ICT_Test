const SampleItem = require('../models/SampleItem');
const Lead = require('../models/Lead');
const LeadEvent = require('../models/LeadEvent');
const AppSettings = require('../models/AppSettings');

const fail = (res, status, message) => res.status(status).json({ status: 'error', message });
const ok = (res, data, status = 200) => res.status(status).json({ status: 'success', data });

const MODES = ['ab', 'A', 'B', 'off'];
const KINDS = ['notes', 'video', 'file'];
const STARTERS = [
  { title: 'CH 6 P1 Networks', kind: 'notes', description: 'Learn the basics of networks with our interactive notes.' },
  { title: 'CH 1 Computer Structure', kind: 'video', description: 'Explanation of the building blocks of ICT: input, processing, output and storage.' },
  { title: 'CH 4 Storage Devices', kind: 'notes', description: 'Learn the basics of storage devices with our interactive notes.' },
  { title: 'Paper 2 revision', kind: 'file', description: 'A final revision covering the Paper 2 practical topics for IGCSE ICT.' },
  { title: 'CH 5 Database', kind: 'video', description: 'Watch the theory first, then see it applied in the practical.' }
];

const cleanUrl = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    const u = new URL(text);
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
};

/** Inserts the starter cards once, so the teacher has something to edit; deleting them later sticks. */
async function seedOnce() {
  const settings = await AppSettings.getGlobal();
  if (settings.samplesSeeded) return settings;
  const claimed = await AppSettings.findOneAndUpdate({ key: 'global', samplesSeeded: { $ne: true } }, { samplesSeeded: true }, { new: true });
  if (claimed && !(await SampleItem.estimatedDocumentCount())) {
    await SampleItem.insertMany(STARTERS.map((s, i) => ({ ...s, order: i, published: true })));
  }
  return claimed || settings;
}

const testMode = (settings) => (MODES.includes(settings.leadTest?.mode) ? settings.leadTest.mode : 'ab');

const shape = (s) => ({ id: s._id, title: s.title, kind: s.kind, url: s.url, description: s.description, order: s.order, published: s.published });

// ---------------------------------------------------------------- public

/** GET /api/settings/samples — published cards + which opt-in test mode is on. */
exports.publicList = async (req, res) => {
  try {
    const settings = await seedOnce();
    const items = await SampleItem.find({ published: true }).sort({ order: 1, createdAt: 1 });
    return ok(res, { samples: items.map(shape), test: { mode: testMode(settings) } });
  } catch (err) {
    console.error('Samples list error:', err);
    return fail(res, 500, 'Could not load samples');
  }
};

const PHONE = /^\+?[0-9]{7,15}$/;

/** POST /api/settings/samples/lead — name + phone from the opt-in form. */
exports.submitLead = async (req, res) => {
  try {
    const { name, phone, variant, visitorId, sampleId, website } = req.body || {};
    if (website) return ok(res, {}); // honeypot: bots fill hidden fields, humans don't
    const cleanName = String(name || '').trim().slice(0, 80);
    const cleanPhone = String(phone || '').replace(/[\s\-().]/g, '');
    if (cleanName.length < 2) return fail(res, 400, 'Please enter your name');
    if (!PHONE.test(cleanPhone)) return fail(res, 400, 'Please enter a valid phone number, e.g. 01012345678 or +201012345678');
    const v = ['A', 'B'].includes(variant) ? variant : 'none';
    const vid = String(visitorId || '').slice(0, 64);

    let sample = null;
    if (sampleId && /^[a-f\d]{24}$/i.test(String(sampleId))) sample = await SampleItem.findById(sampleId).select('title');

    const lead = await Lead.findOne({ phone: cleanPhone });
    if (lead) {
      lead.name = cleanName;
      if (sample && !lead.samples.some(s => String(s.sample) === String(sample._id))) lead.samples.push({ sample: sample._id, title: sample.title });
      await lead.save();
    } else {
      await Lead.create({
        name: cleanName, phone: cleanPhone, variant: v, visitorId: vid,
        samples: sample ? [{ sample: sample._id, title: sample.title }] : []
      });
    }
    if (vid) await LeadEvent.create({ type: 'submit', variant: v, visitorId: vid, sample: sample?._id });
    return ok(res, {}, 201);
  } catch (err) {
    console.error('Lead submit error:', err);
    return fail(res, 500, 'Could not save your details. Please try again.');
  }
};

/** POST /api/settings/samples/event — funnel tracking for the A/B test. Always answers quickly; never errors the page. */
exports.trackEvent = async (req, res) => {
  try {
    const { type, variant, visitorId, sampleId } = req.body || {};
    if (['open', 'prompt', 'dismiss'].includes(type) && visitorId) {
      await LeadEvent.create({
        type,
        variant: ['A', 'B'].includes(variant) ? variant : 'none',
        visitorId: String(visitorId).slice(0, 64),
        sample: /^[a-f\d]{24}$/i.test(String(sampleId || '')) ? sampleId : undefined
      });
    }
  } catch (err) {
    console.warn('Lead event error:', err.message);
  }
  return res.status(204).end();
};

// ---------------------------------------------------------------- teacher: cards

/** GET /api/teacher/samples */
exports.teacherList = async (req, res) => {
  try {
    const settings = await seedOnce();
    const items = await SampleItem.find().sort({ order: 1, createdAt: 1 });
    return ok(res, { samples: items.map(shape), test: { mode: testMode(settings) } });
  } catch (err) {
    console.error('Teacher samples error:', err);
    return fail(res, 500, 'Could not load samples');
  }
};

function readCard(body) {
  const title = String(body.title || '').trim();
  if (!title) return { error: 'Choose or type a title' };
  const url = cleanUrl(body.url);
  if (url === null) return { error: 'The link must start with https://' };
  return {
    value: {
      title: title.slice(0, 120),
      kind: KINDS.includes(body.kind) ? body.kind : 'notes',
      url,
      description: String(body.description || '').trim().slice(0, 400),
      published: body.published !== false
    }
  };
}

/** POST /api/teacher/samples */
exports.create = async (req, res) => {
  try {
    const { value, error } = readCard(req.body);
    if (error) return fail(res, 400, error);
    const last = await SampleItem.findOne().sort({ order: -1 }).select('order');
    const item = await SampleItem.create({ ...value, order: (last?.order ?? -1) + 1 });
    return ok(res, { sample: shape(item) }, 201);
  } catch (err) {
    console.error('Sample create error:', err);
    return fail(res, 500, 'Could not save the sample');
  }
};

/** PUT /api/teacher/samples/:id */
exports.update = async (req, res) => {
  try {
    const { value, error } = readCard(req.body);
    if (error) return fail(res, 400, error);
    const item = await SampleItem.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!item) return fail(res, 404, 'Sample not found');
    return ok(res, { sample: shape(item) });
  } catch (err) {
    console.error('Sample update error:', err);
    return fail(res, 500, 'Could not save the sample');
  }
};

/** DELETE /api/teacher/samples/:id */
exports.remove = async (req, res) => {
  try {
    const item = await SampleItem.findByIdAndDelete(req.params.id);
    if (!item) return fail(res, 404, 'Sample not found');
    return ok(res, {});
  } catch (err) {
    console.error('Sample delete error:', err);
    return fail(res, 500, 'Could not delete the sample');
  }
};

/** PUT /api/teacher/samples/test { mode } — which opt-in design visitors get. */
exports.setTest = async (req, res) => {
  try {
    const mode = req.body?.mode;
    if (!MODES.includes(mode)) return fail(res, 400, 'Unknown mode');
    await AppSettings.findOneAndUpdate({ key: 'global' }, { leadTest: { mode }, updatedBy: req.user.id }, { upsert: true });
    return ok(res, { test: { mode } });
  } catch (err) {
    console.error('Lead test error:', err);
    return fail(res, 500, 'Could not save the setting');
  }
};

// ---------------------------------------------------------------- teacher: leads

/** GET /api/teacher/samples/leads — the contacts, plus the funnel for each opt-in design. */
exports.leads = async (req, res) => {
  try {
    const [leads, funnel, totals] = await Promise.all([
      Lead.find().sort({ createdAt: -1 }).limit(1000),
      LeadEvent.aggregate([
        { $group: { _id: { variant: '$variant', type: '$type', visitor: '$visitorId' } } },
        { $group: { _id: { variant: '$_id.variant', type: '$_id.type' }, visitors: { $sum: 1 } } }
      ]),
      Lead.countDocuments()
    ]);
    const stat = (variant) => {
      const n = (type) => funnel.find(f => f._id.variant === variant && f._id.type === type)?.visitors || 0;
      const opened = n('open');
      const submitted = n('submit');
      return { variant, opened, prompted: n('prompt'), dismissed: n('dismiss'), submitted, rate: opened ? Math.round((submitted / opened) * 1000) / 10 : null };
    };
    return ok(res, {
      total: totals,
      funnel: [stat('A'), stat('B')],
      leads: leads.map(l => ({
        id: l._id, name: l.name, phone: l.phone, variant: l.variant, contacted: l.contacted, note: l.note,
        samples: l.samples.map(s => s.title).filter(Boolean), createdAt: l.createdAt
      }))
    });
  } catch (err) {
    console.error('Leads error:', err);
    return fail(res, 500, 'Could not load leads');
  }
};

/** PATCH /api/teacher/samples/leads/:id { contacted?, note? } */
exports.updateLead = async (req, res) => {
  try {
    const patch = {};
    if (typeof req.body.contacted === 'boolean') patch.contacted = req.body.contacted;
    if (typeof req.body.note === 'string') patch.note = req.body.note.slice(0, 300);
    const lead = await Lead.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!lead) return fail(res, 404, 'Lead not found');
    return ok(res, {});
  } catch (err) {
    console.error('Lead update error:', err);
    return fail(res, 500, 'Could not update the lead');
  }
};

/** DELETE /api/teacher/samples/leads/:id */
exports.removeLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return fail(res, 404, 'Lead not found');
    return ok(res, {});
  } catch (err) {
    console.error('Lead delete error:', err);
    return fail(res, 500, 'Could not delete the lead');
  }
};
