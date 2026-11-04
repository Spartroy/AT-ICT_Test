import * as sfx from './loreSound';

describe('loreSound', () => {
  it('is silent and safe where Web Audio does not exist', () => {
    expect(() => { sfx.unlock(); sfx.unroll(); sfx.gong(); sfx.rustle(); sfx.stamp(); sfx.rollUp(); }).not.toThrow();
  });

  it('remembers the mute choice', () => {
    sfx.setMuted(true);
    expect(sfx.isMuted()).toBe(true);
    expect(localStorage.getItem('atict:lore:muted')).toBe('1');
    sfx.setMuted(false);
    expect(sfx.isMuted()).toBe(false);
  });

  it('does not touch the audio context while muted', () => {
    const ctor = jest.fn();
    window.AudioContext = ctor;
    sfx.setMuted(true);
    sfx.gong();
    expect(ctor).not.toHaveBeenCalled();
    delete window.AudioContext;
    sfx.setMuted(false);
  });
});
