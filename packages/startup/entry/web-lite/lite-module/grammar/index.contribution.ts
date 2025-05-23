/* eslint-disable no-console */
import { Autowired } from '@Nuvio-MCP/di';
import { ClientAppContribution } from '@Nuvio-MCP/ide-core-browser';
import { Disposable, Domain } from '@Nuvio-MCP/ide-core-common';
import { ITextmateTokenizer, ITextmateTokenizerService } from '@Nuvio-MCP/ide-monaco/lib/browser/contrib/tokenizer';
import { getLanguageById } from '@Nuvio-MCP/textmate-languages/es/utils';

// NOTE: 默认启用的语法，可以按需修改
const languages = ['html', 'css', 'javascript', 'less', 'json', 'markdown', 'typescript'];

@Domain(ClientAppContribution)
export class TextmateLanguageGrammarContribution extends Disposable implements ClientAppContribution {
  @Autowired(ITextmateTokenizer)
  private readonly textMateService: ITextmateTokenizerService;

  // 由于使用了预加载 monaco, 导致 lang/grammar contribute 提前
  // 由于依赖了 ext fs provider 注册，因此这里从 onMonacoLoad 改为 onStart
  async initialize() {
    languages
      .map((languageId) => getLanguageById(languageId))
      .filter((item) => !!item)
      .forEach((lang) => {
        try {
          import(
            /* webpackChunkName: "Nuvio-MCP-textmate-languages" */ `@Nuvio-MCP/textmate-languages/es/${
              lang!.extensionPackageName
            }`
          )
            .then(({ default: loadLanguage }) => {
              loadLanguage(
                this.textMateService.registerLanguage.bind(this.textMateService),
                this.textMateService.registerGrammar.bind(this.textMateService),
              );
            })
            .catch((err) => {
              console.log(err.message);
              console.warn(lang, 'cannot load language');
            });
        } catch (err) {
          console.warn(lang, 'cannot load language');
        }
      });
  }
}
