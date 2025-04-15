import { Autowired } from '@Nuvio-MCP/di';
import { AI_CODE_ACTION } from '@Nuvio-MCP/ide-core-browser/lib/ai-native/command';
import { CommandContribution, CommandRegistry, Disposable, Domain, IRange } from '@Nuvio-MCP/ide-core-common';

import { CodeActionService } from './code-action.service';

@Domain(CommandContribution)
export class AICodeActionContribution extends Disposable implements CommandContribution {
  @Autowired(CodeActionService)
  private readonly codeActionService: CodeActionService;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(AI_CODE_ACTION, {
      execute: (range: IRange, id: string) => {
        this.codeActionService.fireCodeActionRun(id, range);
      },
    });
  }
}
