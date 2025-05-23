import * as monaco from '@Nuvio-MCP/ide-monaco';

export const STICKINESS = monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges;

export const BREAK_PONINT_HOVER_MARGIN: monaco.editor.IModelDecorationOptions = {
  description: 'debug-hover',
  glyphMarginClassName: 'sumi-debug-hover',
  linesDecorationsClassName: 'sumi-debug-hover',
  isWholeLine: true,
};

export const TOP_STACK_FRAME_MARGIN: monaco.editor.IModelDecorationOptions = {
  description: 'debug-top-stack-frame',
  glyphMarginClassName: 'sumi-debug-top-stack-frame',
  stickiness: STICKINESS,
};

export const FOCUSED_STACK_FRAME_MARGIN: monaco.editor.IModelDecorationOptions = {
  description: 'debug-focused-stack-frame',
  glyphMarginClassName: 'sumi-debug-focused-stack-frame',
  stickiness: STICKINESS,
};

export const TOP_STACK_FRAME_DECORATION: monaco.editor.IModelDecorationOptions = {
  description: 'debug-top-stack-frame-line',
  isWholeLine: true,
  className: 'sumi-debug-top-stack-frame-line',
  stickiness: STICKINESS,
};

export const FOCUS_BREAKPOINTS_STACK_FRAME_DECORATION: monaco.editor.IModelDecorationOptions = {
  description: 'focus-breakpoints-stack-frame-line',
  isWholeLine: true,
  className: 'sumi-focus-breakpoints-stack-frame-line',
  stickiness: STICKINESS,
};

export const TOP_STACK_FRAME_EXCEPTION_DECORATION: monaco.editor.IModelDecorationOptions = {
  description: 'debug-top-stack-frame-exception-line',
  isWholeLine: true,
  className: 'sumi-debug-top-stack-frame-exception-line',
  stickiness: STICKINESS,
};

export const FOCUSED_STACK_FRAME_DECORATION: monaco.editor.IModelDecorationOptions = {
  description: 'debug-focused-stack-frame-line',
  isWholeLine: true,
  className: 'sumi-debug-focused-stack-frame-line',
  stickiness: STICKINESS,
};

export const TOP_STACK_FRAME_INLINE_DECORATION: monaco.editor.IModelDecorationOptions = {
  description: 'debug-top-stack-frame-column',
  beforeContentClassName: 'sumi-debug-top-stack-frame-column',
};

export const BREAKPOINT_HINT_DECORATION: monaco.editor.IModelDecorationOptions = {
  description: 'debug-breakpoint-hint',
  glyphMarginClassName: 'sumi-debug-breakpoint-hint',
  stickiness: STICKINESS,
};

export const BREAKPOINT_DECORATION: monaco.editor.IModelDecorationOptions = {
  description: 'debug-breakpoint',
  glyphMarginClassName: 'sumi-debug-breakpoint',
  stickiness: STICKINESS,
};

export const BREAKPOINT_DECORATION_DISABLED: monaco.editor.IModelDecorationOptions = {
  description: 'debug-breakpoint-disabled',
  glyphMarginClassName: 'sumi-debug-breakpoint-disabled',
  stickiness: STICKINESS,
};
