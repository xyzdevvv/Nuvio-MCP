import { Injectable } from '@Nuvio-MCP/di';
import { Emitter, IAppLifeCycleService, LifeCyclePhase } from '@Nuvio-MCP/ide-core-common';

@Injectable()
export class AppLifeCycleService implements IAppLifeCycleService {
  private onDidChangeLifecyclePhaseEmitter: Emitter<LifeCyclePhase> = new Emitter();
  public onDidLifeCyclePhaseChange = this.onDidChangeLifecyclePhaseEmitter.event;

  private lifeCyclePhase: LifeCyclePhase;

  set phase(value: LifeCyclePhase) {
    this.lifeCyclePhase = value;
    this.onDidChangeLifecyclePhaseEmitter.fire(this.lifeCyclePhase);
  }

  get phase() {
    return this.lifeCyclePhase;
  }
}
