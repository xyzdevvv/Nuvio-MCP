import { Schemes } from '@Nuvio-MCP/ide-core-common';

import { IMainThreadDocumentsShape } from '../../../../common/vscode';
import { EndOfLine, Position, Range, Uri } from '../../../../common/vscode/ext-types';

import { MirrorTextModel } from './mirror';
import { ensureValidWordDefinition, getWordAtText } from './wordHelper';

import type vscode from 'vscode';

const _modeId2WordDefinition = new Map<string, RegExp | undefined>();
export function setWordDefinitionFor(modeId: string, wordDefinition: RegExp | undefined): void {
  _modeId2WordDefinition.set(modeId, wordDefinition);
}
export function getWordDefinitionFor(modeId: string): RegExp | undefined {
  return _modeId2WordDefinition.get(modeId);
}

export function regExpLeadsToEndlessLoop(regexp: RegExp): boolean {
  // Exit early if it's one of these special cases which are meant to match
  // against an empty string
  if (regexp.source === '^' || regexp.source === '^$' || regexp.source === '$' || regexp.source === '^\\s*$') {
    return false;
  }

  // We check against an empty string. If the regular expression doesn't advance
  // (e.g. ends in an endless loop) it will match an empty string.
  const match = regexp.exec('');

  return !!(match && regexp.lastIndex === 0);
}

export class ExtHostDocumentData extends MirrorTextModel {
  readonly #proxy: IMainThreadDocumentsShape;

  private _languageId: string;
  private _isDirty: boolean;
  private _document: vscode.TextDocument;
  private _textLines: vscode.TextLine[] = [];
  private _isDisposed = false;

  constructor(
    proxy: IMainThreadDocumentsShape,
    uri: Uri,
    lines: string[],
    eol: string,
    languageId: string,
    versionId: number,
    isDirty: boolean,
  ) {
    super(uri, lines, eol, versionId);
    this.#proxy = proxy;
    this._languageId = languageId;
    this._isDirty = isDirty;
  }

  dispose(): void {
    this._isDisposed = true;
    this._isDirty = false;
  }

  equalLines(lines: string[]): boolean {
    const len = lines.length;
    if (len !== this._lines.length) {
      return false;
    }
    for (let i = 0; i < len; i++) {
      if (lines[i] !== this._lines[i]) {
        return false;
      }
    }
    return true;
  }

  get document(): vscode.TextDocument {
    if (!this._document) {
      const data = this;
      this._document = {
        get uri() {
          return data._uri;
        },
        get fileName() {
          return data._uri.fsPath;
        },
        get isUntitled() {
          return data._uri.scheme === Schemes.untitled;
        },
        get languageId() {
          return data._languageId;
        },
        get version() {
          return data._versionId;
        },
        get isClosed() {
          return data._isDisposed;
        },
        get isDirty() {
          return data._isDirty;
        },
        save() {
          return data._save();
        },
        getText(range?) {
          return range ? data._getTextInRange(range) : data.getText();
        },
        get eol() {
          return data._eol === '\n' ? EndOfLine.LF : EndOfLine.CRLF;
        },
        get lineCount() {
          return data._lines.length;
        },
        lineAt(lineOrPos: number | vscode.Position) {
          return data._lineAt(lineOrPos);
        },
        offsetAt(pos) {
          return data._offsetAt(pos);
        },
        positionAt(offset) {
          return data._positionAt(offset);
        },
        validateRange(ran) {
          return data._validateRange(ran);
        },
        validatePosition(pos) {
          return data._validatePosition(pos);
        },
        getWordRangeAtPosition(pos, regexp?) {
          return data._getWordRangeAtPosition(pos, regexp);
        },
      };
    }
    return Object.freeze(this._document);
  }

  _acceptLanguageId(newLanguageId: string): void {
    this._languageId = newLanguageId;
  }

  _getLanguageId(): string {
    return this._languageId;
  }

  _acceptIsDirty(isDirty: boolean): void {
    this._isDirty = isDirty;
  }

  private _save(): Promise<boolean> {
    if (this._isDisposed) {
      return Promise.reject(new Error('Document has been closed'));
    }
    return this.#proxy.$trySaveDocument(this._uri.toString());
  }

  private _getTextInRange(_range: vscode.Range): string {
    const range = this._validateRange(_range);

    if (range.isEmpty) {
      return '';
    }

    if (range.isSingleLine) {
      return this._lines[range.start.line].substring(range.start.character, range.end.character);
    }

    const lineEnding = this._eol;
    const startLineIndex = range.start.line;
    const endLineIndex = range.end.line;
    const resultLines: string[] = [];

    resultLines.push(this._lines[startLineIndex].substring(range.start.character));
    for (let i = startLineIndex + 1; i < endLineIndex; i++) {
      resultLines.push(this._lines[i]);
    }
    resultLines.push(this._lines[endLineIndex].substring(0, range.end.character));

    return resultLines.join(lineEnding);
  }

  private _lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
    let line: number | undefined;
    if (lineOrPosition instanceof Position) {
      line = lineOrPosition.line;
    } else if (typeof lineOrPosition === 'number') {
      line = lineOrPosition;
    }

    if (typeof line !== 'number' || line < 0 || line >= this._lines.length) {
      throw new Error('Illegal value for `line`');
    }

    let result = this._textLines[line];
    if (!result || result.lineNumber !== line || result.text !== this._lines[line]) {
      const text = this._lines[line];
      const firstNonWhitespaceCharacterIndex = /^(\s*)/.exec(text)![1].length;
      const range = new Range(line, 0, line, text.length);
      const rangeIncludingLineBreak = line < this._lines.length - 1 ? new Range(line, 0, line + 1, 0) : range;

      result = Object.freeze({
        lineNumber: line,
        range,
        rangeIncludingLineBreak,
        text,
        firstNonWhitespaceCharacterIndex,
        isEmptyOrWhitespace: firstNonWhitespaceCharacterIndex === text.length,
      });

      this._textLines[line] = result;
    }

    return result;
  }

  private _offsetAt(position: vscode.Position): number {
    position = this._validatePosition(position);
    this._ensureLineStarts();
    return this._lineStarts!.getAccumulatedValue(position.line - 1) + position.character;
  }

  private _positionAt(offset: number): vscode.Position {
    offset = Math.floor(offset);
    offset = Math.max(0, offset);

    this._ensureLineStarts();
    const out = this._lineStarts!.getIndexOf(offset);

    const lineLength = this._lines[out.index].length;

    // Ensure we return a valid position
    return new Position(out.index, Math.min(out.remainder, lineLength));
  }

  // ---- range math

  private _validateRange(range: vscode.Range): vscode.Range {
    if (!(range instanceof Range)) {
      throw new Error('Invalid argument');
    }

    const start = this._validatePosition(range.start);
    const end = this._validatePosition(range.end);

    if (start === range.start && end === range.end) {
      return range;
    }
    return new Range(start.line, start.character, end.line, end.character);
  }

  private _validatePosition(position: vscode.Position): vscode.Position {
    if (!(position instanceof Position)) {
      throw new Error('Invalid argument');
    }

    let { line, character } = position;
    let hasChanged = false;

    if (line < 0) {
      line = 0;
      character = 0;
      hasChanged = true;
    } else if (line >= this._lines.length) {
      line = this._lines.length - 1;
      character = this._lines[line].length;
      hasChanged = true;
    } else {
      const maxCharacter = this._lines[line].length;
      if (character < 0) {
        character = 0;
        hasChanged = true;
      } else if (character > maxCharacter) {
        character = maxCharacter;
        hasChanged = true;
      }
    }

    if (!hasChanged) {
      return position;
    }
    return new Position(line, character);
  }

  private _getWordRangeAtPosition(_position: vscode.Position, regexp?: RegExp): vscode.Range | undefined {
    const position = this._validatePosition(_position);

    if (!regexp) {
      // use default when custom-regexp isn't provided
      regexp = getWordDefinitionFor(this._languageId);
    } else if (regExpLeadsToEndlessLoop(regexp)) {
      // use default when custom-regexp is bad
      // eslint-disable-next-line no-console
      console.warn(
        `[getWordRangeAtPosition]: ignoring custom regexp '${regexp.source}' because it matches the empty string.`,
      );
      regexp = getWordDefinitionFor(this._languageId);
    }

    const wordAtText = getWordAtText(
      position.character + 1,
      ensureValidWordDefinition(regexp),
      this._lines[position.line],
      0,
    );

    if (wordAtText) {
      return new Range(position.line, wordAtText.startColumn - 1, position.line, wordAtText.endColumn - 1);
    }
    return undefined;
  }
}
