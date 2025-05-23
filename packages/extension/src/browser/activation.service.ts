import pm from 'picomatch';

import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IDisposable, ILogger, MaybePromise, MultiMap } from '@Nuvio-MCP/ide-core-common';

import { IActivationEventService } from './types';

/**
 * 管理和发出插件 activateEvents
 * event 格式
 * topic:data
 */

// topic可能支持data通配符，比如workspaceContains: **/a.json

@Injectable()
export class ActivationEventServiceImpl implements IActivationEventService {
  private eventListeners: Map<string, IActivationEventListener[]> = new Map();
  private collectTopicData: MultiMap<string, string> = new MultiMap();

  private wildCardTopics: Set<string> = new Set();
  public activatedEventSet: Set<string> = new Set();

  @Autowired(ILogger)
  protected readonly logger: ILogger;

  constructor() {
    this.wildCardTopics.add('workspaceContains');
  }

  getTopicsData(topic: string): string[] {
    return this.collectTopicData.get(topic) || [];
  }

  async fireEvent(topic: string, data = ''): Promise<void> {
    this.activatedEventSet.add(JSON.stringify({ topic, data }));

    let listeners: IActivationEventListener[] | undefined;
    if (this.wildCardTopics.has(topic)) {
      listeners = this.eventListeners.get(topic);
    } else if (this.eventListeners.has(topic)) {
      listeners = this.eventListeners.get(topic);
    } else {
      listeners = this.eventListeners.get(topic + ':' + data);
    }
    if (listeners) {
      const result = await Promise.allSettled(listeners.map((listener) => this.tryRun(topic, data, listener)));

      for (const item of result) {
        if (item.status === 'rejected') {
          this.logger.error(`fire event ${topic}:${data} error: ${item.reason}`);
        }
      }
    }
  }

  addWildCardTopic(topic: string) {
    this.wildCardTopics.add(topic);
    return {
      dispose: () => {
        this.wildCardTopics.delete(topic);
      },
    };
  }

  onEvent(event: string, listener: () => MaybePromise<void>): IDisposable {
    const index = event.indexOf(':');
    let topic: string;
    let data: string;
    if (index === -1) {
      topic = event;
      data = '';
    } else {
      topic = event.substr(0, index);
      data = event.substr(index + 1);
    }
    return this.addListener(topic, {
      topic,
      data,
      execute: listener,
    });
  }

  /**
   * 为了性能考虑，
   * 对于接受通配符的topic，以topic为单位存储listener
   * 对于不接受通配符的topic，直接以event作为单位存储listener
   * @param topic
   * @param listener
   */
  private addListener(topic: string, listener: IActivationEventListener): IDisposable {
    this.collectTopicData.set(listener.topic, listener.data);

    if (this.wildCardTopics.has(topic)) {
      if (!this.eventListeners.has(topic)) {
        this.eventListeners.set(topic, []);
      }
      this.eventListeners.get(topic)!.push(listener);
      return {
        dispose: () => {
          const index = this.eventListeners.get(topic)!.indexOf(listener);
          if (index !== -1) {
            this.eventListeners.get(topic)!.splice(index, 1);
          }
        },
      };
    } else {
      const event = topic + ':' + listener.data;
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event)!.push(listener);
      return {
        dispose: () => {
          const index = this.eventListeners.get(event)!.indexOf(listener);
          if (index !== -1) {
            this.eventListeners.get(event)!.splice(index, 1);
          }
        },
      };
    }
  }

  async tryRun(topic: string, data: string, listener: IActivationEventListener) {
    if (this.wildCardTopics.has(topic)) {
      if (pm(listener.data)(data)) {
        await listener.execute();
      }
    } else {
      await listener.execute();
    }
  }
}

interface IActivationEventListener {
  topic: string;

  data: string;

  execute: () => MaybePromise<void>;
}
