import { Autowired } from '@Nuvio-MCP/di';
import { AppConfig, ClientAppContribution, Disposable } from '@Nuvio-MCP/ide-core-browser';
import { DevtoolsLantencyCommand, EDevtoolsEvent } from '@Nuvio-MCP/ide-core-common/lib/devtools';
import { Domain } from '@Nuvio-MCP/ide-core-common/lib/di-helper';

import { ConnectionRTTBrowserService, ConnectionRTTBrowserServiceToken } from './connection-rtt-service';

@Domain(ClientAppContribution)
export class ChromeDevtoolsContribution extends Disposable implements ClientAppContribution {
  @Autowired(AppConfig)
  private readonly appConfig: AppConfig;

  @Autowired(ConnectionRTTBrowserServiceToken)
  protected readonly rttService: ConnectionRTTBrowserService;

  private interval?: NodeJS.Timeout;

  static INTERVAL = 1000;

  protected lantencyHandler = (event: CustomEvent) => {
    const { command } = event.detail;
    if (command === DevtoolsLantencyCommand.Start) {
      if (!this.interval) {
        this.startRTTInterval();
      }
    } else if (command === DevtoolsLantencyCommand.Stop) {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = undefined;
      }
    }
  };

  initialize() {
    // only runs when devtools supoprt is enabled
    if (this.appConfig.devtools) {
      // receive notification from Nuvio-MCP devtools by custom event
      window.addEventListener(EDevtoolsEvent.Latency, this.lantencyHandler);

      this.addDispose(
        Disposable.create(() => {
          window.removeEventListener(EDevtoolsEvent.Latency, this.lantencyHandler);
          if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
          }
        }),
      );

      // if Nuvio-MCP devtools has started capturing before this contribution point is registered
      if (window.__Nuvio-MCP_DEVTOOLS_GLOBAL_HOOK__?.captureRPC) {
        if (!this.interval) {
          this.startRTTInterval();
        }
      }
    }
  }

  private startRTTInterval() {
    this.interval = setInterval(async () => {
      const start = Date.now();
      await this.rttService.measure();
      const rtt = Date.now() - start;
      // "if" below is to prevent setting latency after stopping capturing
      if (window.__Nuvio-MCP_DEVTOOLS_GLOBAL_HOOK__.captureRPC) {
        window.__Nuvio-MCP_DEVTOOLS_GLOBAL_HOOK__.latency = rtt;
      }
    }, ChromeDevtoolsContribution.INTERVAL);
  }
}
