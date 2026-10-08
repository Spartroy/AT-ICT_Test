import '@testing-library/jest-dom';

// jsdom has no matchMedia. Default to reduced motion so animations (confetti) stay off;
// individual tests can override window.matchMedia.
beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn()
  }));
  window.scrollTo = jest.fn();
});
