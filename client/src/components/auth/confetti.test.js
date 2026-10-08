import { fireConfetti } from './confetti';

const fakeContext = () => ({
  scale: jest.fn(), clearRect: jest.fn(), save: jest.fn(), restore: jest.fn(), translate: jest.fn(),
  rotate: jest.fn(), beginPath: jest.fn(), arc: jest.fn(), fill: jest.fn(), fillRect: jest.fn()
});

const setReducedMotion = (reduce) => {
  window.matchMedia = jest.fn().mockImplementation(query => ({ matches: reduce && query.includes('reduce'), media: query }));
};

afterEach(() => jest.restoreAllMocks());

it('adds a full-screen canvas and removes it on cancel when motion is allowed', () => {
  setReducedMotion(false);
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext());
  const cancel = fireConfetti({ left: 0, top: 0, width: 400 });
  const canvas = document.body.lastElementChild;
  expect(canvas.tagName).toBe('CANVAS');
  expect(canvas).toHaveAttribute('aria-hidden', 'true');
  expect(canvas.style.pointerEvents).toBe('none');
  cancel();
  expect(canvas.isConnected).toBe(false);
});

it('does nothing for reduced-motion users', () => {
  setReducedMotion(true);
  const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext');
  const before = document.body.childElementCount;
  fireConfetti();
  expect(getContext).not.toHaveBeenCalled();
  expect(document.body.childElementCount).toBe(before);
});
