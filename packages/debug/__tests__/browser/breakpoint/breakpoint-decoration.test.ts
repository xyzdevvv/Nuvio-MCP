import { URI } from '@Nuvio-MCP/ide-core-browser';
import { IDebugBreakpoint } from '@Nuvio-MCP/ide-debug';
import { DebugBreakpoint, DebugDecorator } from '@Nuvio-MCP/ide-debug/lib/browser/breakpoint';

describe('Breakpoints Decoration', () => {
  const prefix = 'sumi-debug-breakpoint';

  describe('Get breakpoint decoration with debugMode', () => {
    const decoration: DebugDecorator = new DebugDecorator();
    it('when breakpoint is disabled', () => {
      const breakpoint: IDebugBreakpoint = DebugBreakpoint.create(
        new URI('test.js'),
        {
          line: 1,
        },
        false,
      );
      const dec = decoration.getDecoration(breakpoint, true);
      expect(dec.className).toBe(`${prefix}-disabled`);
      expect(dec.message[0]).toBe('');
    });

    it('when breakpoint is unverified breakpoint', () => {
      const breakpoint: IDebugBreakpoint = DebugBreakpoint.create(
        new URI('test.js'),
        {
          line: 1,
        },
        true,
      );
      breakpoint.status = new Map();
      breakpoint.status.set(breakpoint.id, {
        verified: false,
      });
      const dec = decoration.getDecoration(breakpoint, true);
      expect(dec.className).toBe(`${prefix}-unverified`);
      expect(dec.message[0]).toBe('');
    });

    it('when breakpoint is logPoint', () => {
      const breakpoint: IDebugBreakpoint = DebugBreakpoint.create(
        new URI('test.js'),
        {
          line: 1,
          logMessage: 'console',
        },
        true,
      );
      breakpoint.status = new Map();
      breakpoint.status.set('test', {
        verified: true,
      });
      const dec = decoration.getDecoration(breakpoint, true);
      expect(dec.className).toBe('sumi-debug-logpoint');
    });

    it('when breakpoint is conditionPoint', () => {
      const breakpoint: IDebugBreakpoint = DebugBreakpoint.create(
        new URI('test.js'),
        {
          line: 1,
          condition: 'console',
        },
        true,
      );
      breakpoint.status = new Map();
      breakpoint.status.set('test', {
        verified: true,
      });
      const dec = decoration.getDecoration(breakpoint, true);
      expect(dec.className).toBe('sumi-debug-conditional-breakpoint');
    });

    it('when breakpoint is normal breakpoint', () => {
      const breakpoint: IDebugBreakpoint = DebugBreakpoint.create(
        new URI('test.js'),
        {
          line: 1,
        },
        true,
      );
      breakpoint.status = new Map();
      breakpoint.status.set('test', {
        verified: true,
      });
      const dec = decoration.getDecoration(breakpoint, true);
      expect(dec.className).toBe('sumi-debug-breakpoint');
    });
  });

  describe('Get breakpoint decoration without debugMode', () => {
    const decoration: DebugDecorator = new DebugDecorator();

    it('when breakpoint is unverified breakpoint', () => {
      const breakpoint: IDebugBreakpoint = DebugBreakpoint.create(
        new URI('test.js'),
        {
          line: 1,
        },
        true,
      );
      breakpoint.status = new Map();
      breakpoint.status.set(breakpoint.id, {
        verified: false,
      });
      const dec = decoration.getDecoration(breakpoint, false);
      expect(dec.className).toBe(`${prefix}`);
      expect(dec.message[0]).toBe('');
    });
  });
});
