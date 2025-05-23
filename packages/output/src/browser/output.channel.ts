import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { PreferenceService } from '@Nuvio-MCP/ide-core-browser';
import { OUTPUT_CONTAINER_ID } from '@Nuvio-MCP/ide-core-browser/lib/common/container-id';
import { Deferred, Disposable, IEventBus, Schemes, URI, localize, strings, uuid } from '@Nuvio-MCP/ide-core-common';
import { IEditorDocumentModelRef, IEditorDocumentModelService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout';
import * as monaco from '@Nuvio-MCP/ide-monaco';
import { ITextModel } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-api/types';
import { EditOperation } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/core/editOperation';

import { ContentChangeEvent, ContentChangeEventPayload, ContentChangeType } from '../common';

import { OutputPreferences } from './output-preference';

const { removeAnsiEscapeCodes } = strings;
const DEFAULT_MAX_CHANNEL_LINE = 50000;

@Injectable({ multiple: true })
export class OutputChannel extends Disposable {
  private outputLines: string[] = [];
  private visible = true;
  private shouldLogToBrowser = false;

  @Autowired(IMainLayoutService)
  private readonly layoutService: IMainLayoutService;

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @Autowired(OutputPreferences)
  private readonly outputPreferences: OutputPreferences;

  @Autowired(IEditorDocumentModelService)
  protected readonly documentService: IEditorDocumentModelService;

  @Autowired(IEventBus)
  private readonly eventBus: IEventBus;

  public outputModel: IEditorDocumentModelRef;

  private monacoModel: ITextModel;

  public modelReady: Deferred<void> = new Deferred();

  private maxChannelLine: number = DEFAULT_MAX_CHANNEL_LINE;

  private enableHighlight = true;

  constructor(@Optional() public readonly name: string) {
    super();

    const preferenceMaxLine = this.preferenceService.get<number>('output.maxChannelLine');
    if (preferenceMaxLine) {
      this.maxChannelLine = preferenceMaxLine;
    }

    this.enableHighlight = Boolean(this.preferenceService.get<boolean>('output.enableLogHighlight'));

    this.setShouldLogToBrowser();

    this.addDispose(
      this.preferenceService.onPreferenceChanged((e) => {
        switch (e.preferenceName) {
          case 'output.maxChannelLine':
            this.onDidMaxChannelLineChange(e);
            break;
          case 'output.logWhenNoPanel':
            this.setShouldLogToBrowser();
            break;
          case 'output.enableLogHighlight':
            this.onDidLogHighlightChange(e);
            break;
          default:
            break;
        }
      }),
    );

    const uri = new URI(`${Schemes.walkThroughSnippet}://output/${name || uuid()}`);
    this.documentService.createModelReference(uri).then((model) => {
      this.outputModel = model;
      this.monacoModel = this.outputModel.instance.getMonacoModel();
      this.monacoModel.setValue(localize('output.channel.none', '<no output yet>'));

      if (this.enableHighlight) {
        this.outputModel.instance.languageId = 'log';
      }
      this.modelReady.resolve();
    });
  }

  private onDidMaxChannelLineChange(event) {
    if (event.newValue !== this.maxChannelLine) {
      this.maxChannelLine = event.newValue;
    }
  }

  private onDidLogHighlightChange(event) {
    this.modelReady.promise.then(() => {
      if (event.newValue !== this.enableHighlight) {
        this.enableHighlight = event.newValue;
      }
      if (event.newValue) {
        this.outputModel.instance.languageId = 'log';
      } else {
        this.outputModel.instance.languageId = 'plaintext';
      }
    });
  }

  private setShouldLogToBrowser() {
    const noVisiblePanel = !this.layoutService.getTabbarHandler(OUTPUT_CONTAINER_ID);
    const logWhenNoPanel = this.outputPreferences['output.logWhenNoPanel'];
    this.shouldLogToBrowser = Boolean(noVisiblePanel && logWhenNoPanel);
  }

  private doReplace(value: string) {
    this.monacoModel.setValue(value);
  }

  private applyEdits(value: string): void {
    const lastLine = this.monacoModel.getLineCount();
    const lastLineMaxColumn = this.monacoModel.getLineMaxColumn(lastLine);
    const edits = [EditOperation.insert(new monaco.Position(lastLine, lastLineMaxColumn), value)];
    this.monacoModel.applyEdits(edits);
  }

  private isEmptyChannel(): boolean {
    return this.outputLines.length === 0;
  }

  private doAppend(value: string): void {
    let needSlice = false;
    if (this.outputLines.length + 1 >= this.maxChannelLine) {
      needSlice = true;
      this.outputLines = this.outputLines.slice(this.maxChannelLine / 2);
    }
    // 由于 model 创建是异步的， 这里要等 modelReady 才能写入
    this.modelReady.promise.then(() => {
      if (this.isEmptyChannel() || needSlice) {
        this.doReplace(this.outputLines.join('') + value);
      } else {
        this.applyEdits(value);
      }
      this.outputLines.push(value);
    });
  }

  append(value: string): void {
    this.eventBus.fire(
      new ContentChangeEvent(
        new ContentChangeEventPayload(this.name, ContentChangeType.append, value, this.outputLines),
      ),
    );
    this.doAppend(removeAnsiEscapeCodes(value));
  }

  appendLine(line: string): void {
    let value = line;
    if (typeof line !== 'string') {
      try {
        value = JSON.stringify(line);
      } catch (e) {
        value = `[${typeof line}]`;
      }
    }

    if (!value.endsWith('\r\n')) {
      value = value + '\r\n';
    }

    this.eventBus.fire(
      new ContentChangeEvent(
        new ContentChangeEventPayload(this.name, ContentChangeType.appendLine, value, this.outputLines),
      ),
    );
    this.doAppend(removeAnsiEscapeCodes(value));
    if (this.shouldLogToBrowser) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[${this.name}]` + `%c ${value}}`,
        'background:rgb(50, 150, 250); color: #fff',
        'background: none; color: inherit',
      );
    }
  }

  replace(value: string): void {
    this.outputLines = [];
    this.modelReady.promise.then(() => this.monacoModel.setValue(''));
    this.append(value);
  }

  clear(): void {
    this.outputLines = [];
    this.modelReady.promise.then(() => this.monacoModel.setValue(localize('output.channel.none', '还没有任何输出')));
    this.eventBus.fire(
      new ContentChangeEvent(
        new ContentChangeEventPayload(this.name, ContentChangeType.appendLine, '', this.outputLines),
      ),
    );
  }

  setVisibility(visible: boolean): void {
    this.visible = visible;

    if (visible) {
      const handler = this.layoutService.getTabbarHandler(OUTPUT_CONTAINER_ID);
      if (!handler) {
        return;
      }
      // TODO 这里的逻辑是不是写错了
      if (!handler.isVisible) {
        handler.activate();
      }
    }
  }

  async setLanguageId(languageId: string): Promise<void> {
    await this.modelReady.promise;
    this.outputModel.instance.languageId = languageId;
  }

  get isVisible(): boolean {
    return this.visible;
  }
}
