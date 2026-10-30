const StudyGuide = require('../models/StudyGuide');
const defaultGuide = require('../data/studyGuideDefault.json');
const { sanitizeGuide } = require('../validators/studyGuide');

const fail = (res, error, what) => {
  console.error(`Study guide ${what} error:`, error);
  res.status(500).json({ status: 'error', message: `Server error ${what}` });
};

// The guide as students see it: the published copy, or the one that ships with the app.
const liveContent = (guide) => guide.published || defaultGuide;

// @desc    The guide students read
// @route   GET /api/guide
// @access  Private
const getGuide = async (req, res) => {
  try {
    const guide = await StudyGuide.getMain();
    res.status(200).json({ status: 'success', data: { content: liveContent(guide), publishedAt: guide.publishedAt } });
  } catch (error) {
    fail(res, error, 'loading the study guide');
  }
};

// @desc    The teacher's working copy (draft if there is one, else what students see)
// @route   GET /api/guide/edit
// @access  Teacher
const getEditable = async (req, res) => {
  try {
    const guide = await StudyGuide.getMain();
    res.status(200).json({
      status: 'success',
      data: {
        content: guide.draft || liveContent(guide),
        hasDraft: !!guide.draft,
        draftSavedAt: guide.draftSavedAt,
        publishedAt: guide.publishedAt,
        isCustomised: !!guide.published
      }
    });
  } catch (error) {
    fail(res, error, 'loading the editor');
  }
};

// @desc    Save the working copy without showing it to students
// @route   PUT /api/guide/draft
// @access  Teacher
const saveDraft = async (req, res) => {
  const { doc, error } = sanitizeGuide(req.body.content);
  if (error) return res.status(400).json({ status: 'error', message: error });
  try {
    const guide = await StudyGuide.findOneAndUpdate(
      { key: 'main' },
      { $set: { draft: doc, draftSavedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ status: 'success', data: { draftSavedAt: guide.draftSavedAt } });
  } catch (err) {
    fail(res, err, 'saving the draft');
  }
};

// @desc    Throw the draft away and go back to what students see
// @route   DELETE /api/guide/draft
// @access  Teacher
const discardDraft = async (req, res) => {
  try {
    const guide = await StudyGuide.findOneAndUpdate({ key: 'main' }, { $set: { draft: null, draftSavedAt: null } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.status(200).json({ status: 'success', data: { content: liveContent(guide) } });
  } catch (error) {
    fail(res, error, 'discarding the draft');
  }
};

// @desc    Make the working copy the one students read
// @route   POST /api/guide/publish   (optional body.content: publish exactly what the editor holds)
// @access  Teacher
const publish = async (req, res) => {
  try {
    let doc;
    if (req.body.content) {
      const result = sanitizeGuide(req.body.content);
      if (result.error) return res.status(400).json({ status: 'error', message: result.error });
      doc = result.doc;
    } else {
      const current = await StudyGuide.getMain();
      if (!current.draft) return res.status(400).json({ status: 'error', message: 'There are no changes to publish' });
      doc = current.draft;
    }
    const guide = await StudyGuide.findOneAndUpdate(
      { key: 'main' },
      { $set: { published: doc, publishedAt: new Date(), publishedBy: req.user.id, draft: null, draftSavedAt: null } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ status: 'success', message: 'Published. Students now see this version.', data: { publishedAt: guide.publishedAt } });
  } catch (error) {
    fail(res, error, 'publishing the guide');
  }
};

// @desc    Go back to the guide that ships with the app, for students and the editor
// @route   POST /api/guide/reset
// @access  Teacher
const resetToOriginal = async (req, res) => {
  try {
    await StudyGuide.findOneAndUpdate(
      { key: 'main' },
      { $set: { published: null, publishedAt: null, publishedBy: null, draft: null, draftSavedAt: null } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ status: 'success', message: 'The original guide is back.', data: { content: defaultGuide } });
  } catch (error) {
    fail(res, error, 'resetting the guide');
  }
};

module.exports = { getGuide, getEditable, saveDraft, discardDraft, publish, resetToOriginal };
