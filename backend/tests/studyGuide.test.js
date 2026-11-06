const { sanitizeGuide, cleanString } = require('../validators/studyGuide');
const defaults = require('../data/studyGuideDefault.json');

const guide = (patch = {}) => ({
  version: 1,
  chapters: [{
    id: 'c1', key: '1', n: '1', title: 'Computers', hl: '', blurb: '',
    secs: [{ id: 's1', num: '1.1', title: 'What', blocks: [{ id: 'b1', t: 'def', l: 'Computer', h: 'A <b>device</b>' }] }],
    quiz: [{ id: 'q1', sec: '1.1', t: 'Pick', o: ['a', 'b'], c: 1, e: '' }],
    ...patch
  }]
});

describe('study guide validator', () => {
  test('the guide that ships with the app is valid', () => {
    const { doc, error } = sanitizeGuide(defaults);
    expect(error).toBeUndefined();
    expect(doc.chapters).toHaveLength(14);
  });

  test('keeps bold and line breaks but strips every other tag and attribute', () => {
    expect(cleanString('<b>keep</b> <i>this</i><br>')).toBe('<b>keep</b> <i>this</i><br>');
    expect(cleanString('<img src=x onerror=alert(1)>hi<script>bad()</script>')).toBe('hibad()');
    expect(cleanString('<b onclick="x()">no</b>')).toBe('<b>no</b>');
  });

  test('leaves plain comparison signs alone', () => {
    expect(cleanString('5 < 6 and 7 > 3')).toBe('5 < 6 and 7 > 3');
  });

  test('cleans strings deep inside blocks', () => {
    const { doc } = sanitizeGuide(guide({ secs: [{ id: 's1', num: '1.1', title: 'T<script>', blocks: [{ id: 'b1', t: 'hint', h: '<a href="x">tip</a>' }] }] }));
    expect(doc.chapters[0].secs[0].title).toBe('T');
    expect(doc.chapters[0].secs[0].blocks[0].h).toBe('tip');
  });

  test('rejects unknown block types', () => {
    const bad = guide({ secs: [{ id: 's1', num: '1.1', title: 'T', blocks: [{ id: 'b1', t: 'iframe' }] }] });
    expect(sanitizeGuide(bad).error).toMatch(/Unknown block/);
  });

  test('rejects a quiz answer that points past the options', () => {
    const bad = guide({ quiz: [{ id: 'q1', sec: '1.1', t: 'Pick', o: ['a', 'b'], c: 2, e: '' }] });
    expect(sanitizeGuide(bad).error).toMatch(/correct answer/);
  });

  test('rejects a body that is not a guide', () => {
    expect(sanitizeGuide(null).error).toBeDefined();
    expect(sanitizeGuide({ chapters: [] }).error).toBeDefined();
  });
});

describe('cleanString formatting', () => {
  it('keeps underline and the colour and size spans, turns browser <font> into spans', () => {
    expect(cleanString('<u>a</u> <span class="c-blue s-lg">b</span>')).toBe('<u>a</u> <span class="c-blue s-lg">b</span>');
    expect(cleanString('<font color="#1d4ed8" size="5">b</font>')).toBe('<span class="c-blue s-lg">b</span>');
    expect(cleanString('<font color="#000001">auto</font> <span style="color: rgb(5, 150, 105)">g</span>')).toBe('auto <span class="c-green">g</span>');
  });
  it('drops unknown classes, styles and scripts', () => {
    expect(cleanString('<span class="evil" style="position:fixed">x</span><span class="c-red">y</span>')).toBe('xy');
    expect(cleanString('<span class="c-ink" onclick="x()">z</span>')).toBe('<span class="c-ink">z</span>');
  });
});
