import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useSessionScrollRestoration from '@/shared/hooks/generic/useSessionScrollRestoration';

interface TestScrollerProps {
  enabled: boolean;
  mounted?: boolean;
  ready?: boolean;
  storageKey?: string;
}

function TestScroller({
  enabled,
  mounted = true,
  ready = true,
  storageKey = 'test-scroll',
}: TestScrollerProps) {
  const { scrollRef, handleScroll } = useSessionScrollRestoration(storageKey, {
    enabled,
    ready,
  });

  if (!enabled || !mounted) return null;

  return <div data-testid='scroller' ref={scrollRef} onScroll={handleScroll} />;
}

/**
 * The scroller stays mounted regardless of "enabled", which none of the real
 * callers do -- they keep the whole dialog closed instead. The hook's own
 * "enabled" gate therefore has no other way of being reached.
 */
function MountedWhileDisabledScroller({ enabled }: { enabled: boolean }) {
  const { scrollRef, handleScroll } = useSessionScrollRestoration(
    'mounted-while-disabled-scroll',
    { enabled },
  );

  return <div data-testid='scroller' ref={scrollRef} onScroll={handleScroll} />;
}

/**
 * sessionStorage has to be stubbed as a global. Spying on Storage.prototype
 * does not reach it: jsdom backs sessionStorage with a proxy that owns its own
 * methods, so the hook never goes through the prototype and the spy ends up
 * recording zero calls while the test still passes.
 */
function stubUnavailableStorage() {
  vi.stubGlobal('sessionStorage', {
    getItem: () => {
      throw new Error('Storage unavailable');
    },
    setItem: () => {
      throw new Error('Storage unavailable');
    },
  });
}

describe('useSessionScrollRestoration', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves the scroll position on close and restores it on reopen', () => {
    const view = render(<TestScroller enabled />);
    const scroller = view.getByTestId('scroller');

    scroller.scrollTop = 240;
    fireEvent.scroll(scroller);
    view.rerender(<TestScroller enabled={false} />);

    expect(sessionStorage.getItem('test-scroll')).toBe('240');

    view.rerender(<TestScroller enabled />);
    expect(view.getByTestId('scroller').scrollTop).toBe(240);
  });

  it('keeps positions separate by storage key', () => {
    sessionStorage.setItem('first-scroll', '120');
    sessionStorage.setItem('second-scroll', '360');

    const first = render(<TestScroller enabled storageKey='first-scroll' />);
    const second = render(<TestScroller enabled storageKey='second-scroll' />);

    expect(first.container.querySelector('div')?.scrollTop).toBe(120);
    expect(second.container.querySelector('div')?.scrollTop).toBe(360);
  });

  it('waits until the scroll content is ready before restoring', () => {
    sessionStorage.setItem('test-scroll', '480');
    const view = render(<TestScroller enabled ready={false} />);

    expect(view.getByTestId('scroller').scrollTop).toBe(0);

    view.rerender(<TestScroller enabled ready />);
    expect(view.getByTestId('scroller').scrollTop).toBe(480);
  });

  it('restores when a portal mounts after the parent layout effect', () => {
    sessionStorage.setItem('test-scroll', '320');
    const view = render(<TestScroller enabled mounted={false} />);

    view.rerender(<TestScroller enabled mounted />);

    expect(view.getByTestId('scroller').scrollTop).toBe(320);
  });

  it('does not restore while disabled, even if the scroller stays mounted', () => {
    sessionStorage.setItem('mounted-while-disabled-scroll', '520');

    const view = render(<MountedWhileDisabledScroller enabled={false} />);
    expect(view.getByTestId('scroller').scrollTop).toBe(0);

    view.rerender(<MountedWhileDisabledScroller enabled />);
    expect(view.getByTestId('scroller').scrollTop).toBe(520);
  });

  it('restores when the storage key changes while the scroller stays mounted', () => {
    sessionStorage.setItem('first-scroll', '150');
    sessionStorage.setItem('second-scroll', '450');

    const view = render(<TestScroller enabled storageKey='first-scroll' />);
    expect(view.getByTestId('scroller').scrollTop).toBe(150);

    // The scroller is never detached here, so the restore has to come from the
    // changed storage key alone.
    view.rerender(<TestScroller enabled storageKey='second-scroll' />);
    expect(view.getByTestId('scroller').scrollTop).toBe(450);
  });

  it('falls back to the top for an invalid stored position', () => {
    sessionStorage.setItem('test-scroll', 'not-a-number');

    const view = render(<TestScroller enabled />);

    expect(view.getByTestId('scroller').scrollTop).toBe(0);
  });

  it('treats a negative stored position as the top', () => {
    sessionStorage.setItem('negative-scroll', '-5');

    const view = render(<TestScroller enabled storageKey='negative-scroll' />);
    expect(view.getByTestId('scroller').scrollTop).toBe(0);

    view.rerender(
      <TestScroller enabled={false} storageKey='negative-scroll' />,
    );
    expect(sessionStorage.getItem('negative-scroll')).toBe('0');
  });

  it('saves under the key that is current when the scroller closes', () => {
    const view = render(<TestScroller enabled storageKey='first-scroll' />);

    view.rerender(<TestScroller enabled storageKey='second-scroll' />);

    const scroller = view.getByTestId('scroller');
    scroller.scrollTop = 90;
    fireEvent.scroll(scroller);
    view.rerender(<TestScroller enabled={false} storageKey='second-scroll' />);

    expect(sessionStorage.getItem('second-scroll')).toBe('90');
    // Changing the key also changes "savePosition", so the effect re-runs and
    // its cleanup persists the position under the key that was current before.
    expect(sessionStorage.getItem('first-scroll')).toBe('0');
  });

  it('does not overwrite the saved position while disabled', () => {
    const view = render(<MountedWhileDisabledScroller enabled />);
    const scroller = view.getByTestId('scroller');

    scroller.scrollTop = 240;
    fireEvent.scroll(scroller);
    view.rerender(<MountedWhileDisabledScroller enabled={false} />);
    expect(sessionStorage.getItem('mounted-while-disabled-scroll')).toBe('240');

    // Saving is gated on "enabled" as well, so a scroll that happens while
    // restoration is off must not overwrite what was already persisted.
    scroller.scrollTop = 300;
    fireEvent.scroll(scroller);
    view.unmount();

    expect(sessionStorage.getItem('mounted-while-disabled-scroll')).toBe('240');
  });

  it('returns to the top when the stored position cannot be read', () => {
    sessionStorage.setItem('unreadable-scroll', '240');
    const view = render(
      <TestScroller enabled storageKey='unreadable-scroll' />,
    );
    expect(view.getByTestId('scroller').scrollTop).toBe(240);

    stubUnavailableStorage();

    // "ready" flips while the scroller stays mounted, so the ref is
    // re-attached and the restore runs again -- this time the read fails and
    // there is no position to go back to.
    view.rerender(
      <TestScroller enabled ready={false} storageKey='unreadable-scroll' />,
    );
    view.rerender(<TestScroller enabled storageKey='unreadable-scroll' />);

    expect(view.getByTestId('scroller').scrollTop).toBe(0);

    // The recorded position is reset too, so closing the scroller here cannot
    // persist the value the failed read fell back from.
    vi.unstubAllGlobals();
    view.unmount();
    expect(sessionStorage.getItem('unreadable-scroll')).toBe('0');
  });

  it('continues working when session storage is unavailable', () => {
    stubUnavailableStorage();

    expect(() => render(<TestScroller enabled />)).not.toThrow();
    expect(() =>
      render(<TestScroller enabled storageKey='another-key' />),
    ).not.toThrow();
  });

  it('does not throw when saving with session storage unavailable', () => {
    const view = render(<TestScroller enabled />);
    const scroller = view.getByTestId('scroller');

    scroller.scrollTop = 240;
    fireEvent.scroll(scroller);

    stubUnavailableStorage();

    expect(() => view.rerender(<TestScroller enabled={false} />)).not.toThrow();
  });
});
