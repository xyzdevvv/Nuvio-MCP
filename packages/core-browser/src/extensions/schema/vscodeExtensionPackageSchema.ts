import { localize } from '@Nuvio-MCP/ide-core-common';

export const EXTENSION_IDENTIFIER_PATTERN = '^([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$';

export const VSCodeExtensionPackageSchema = {
  properties: {
    engines: {
      type: 'object',
      description: localize('vscode.extension.engines', 'Engine compatibility.'),
      properties: {
        vscode: {
          type: 'string',
          description: localize(
            'vscode.extension.engines.vscode',
            'For VS Code extensions, specifies the VS Code version that the extension is compatible with. Cannot be *. For example: ^0.10.5 indicates compatibility with a minimum VS Code version of 0.10.5.',
          ),
          default: '^1.22.0',
        },
      },
    },
    publisher: {
      description: localize('vscode.extension.publisher', 'The publisher of the VS Code extension.'),
      type: 'string',
    },
    displayName: {
      description: localize(
        'vscode.extension.displayName',
        'The display name for the extension used in the VS Code gallery.',
      ),
      type: 'string',
    },
    categories: {
      description: localize(
        'vscode.extension.categories',
        'The categories used by the VS Code gallery to categorize the extension.',
      ),
      type: 'array',
      uniqueItems: true,
      items: {
        oneOf: [
          {
            type: 'string',
            enum: [
              'Programming Languages',
              'Snippets',
              'Linters',
              'Themes',
              'Debuggers',
              'Other',
              'Keymaps',
              'Formatters',
              'Extension Packs',
              'SCM Providers',
              'Azure',
              'Language Packs',
            ],
          },
          {
            type: 'string',
            const: 'Languages',
            deprecationMessage: localize(
              'vscode.extension.category.languages.deprecated',
              "Use 'Programming  Languages' instead",
            ),
          },
        ],
      },
    },
    galleryBanner: {
      type: 'object',
      description: localize('vscode.extension.galleryBanner', 'Banner used in the VS Code marketplace.'),
      properties: {
        color: {
          description: localize(
            'vscode.extension.galleryBanner.color',
            'The banner color on the VS Code marketplace page header.',
          ),
          type: 'string',
        },
        theme: {
          description: localize(
            'vscode.extension.galleryBanner.theme',
            'The color theme for the font used in the banner.',
          ),
          type: 'string',
          enum: ['dark', 'light'],
        },
      },
    },
    contributes: {
      description: localize(
        'vscode.extension.contributes',
        'All contributions of the VS Code extension represented by this package.',
      ),
      type: 'object',
      properties: {
        // extensions will fill in
      } as { [key: string]: any },
      default: {},
    },
    preview: {
      type: 'boolean',
      description: localize(
        'vscode.extension.preview',
        'Sets the extension to be flagged as a Preview in the Marketplace.',
      ),
    },
    activationEvents: {
      description: localize('vscode.extension.activationEvents', 'Activation events for the VS Code extension.'),
      type: 'array',
      items: {
        type: 'string',
        defaultSnippets: [
          {
            label: 'onLanguage',
            description: localize(
              'vscode.extension.activationEvents.onLanguage',
              'An activation event emitted whenever a file that resolves to the specified language gets opened.',
            ),
            body: 'onLanguage:${1:languageId}',
          },
          {
            label: 'onCommand',
            description: localize(
              'vscode.extension.activationEvents.onCommand',
              'An activation event emitted whenever the specified command gets invoked.',
            ),
            body: 'onCommand:${2:commandId}',
          },
          {
            label: 'onDebug',
            description: localize(
              'vscode.extension.activationEvents.onDebug',
              'An activation event emitted whenever a user is about to start debugging or about to setup debug configurations.',
            ),
            body: 'onDebug',
          },
          {
            label: 'onDebugInitialConfigurations',
            description: localize(
              'vscode.extension.activationEvents.onDebugInitialConfigurations',
              'An activation event emitted whenever a "launch.json" needs to be created (and all provideDebugConfigurations methods need to be called).',
            ),
            body: 'onDebugInitialConfigurations',
          },
          {
            label: 'onDebugResolve',
            description: localize(
              'vscode.extension.activationEvents.onDebugResolve',
              'An activation event emitted whenever a debug session with the specific type is about to be launched (and a corresponding resolveDebugConfiguration method needs to be called).',
            ),
            body: 'onDebugResolve:${6:type}',
          },
          {
            label: 'onDebugAdapterProtocolTracker',
            description: localize(
              'vscode.extension.activationEvents.onDebugAdapterProtocolTracker',
              'An activation event emitted whenever a debug session with the specific type is about to be launched and a debug protocol tracker might be needed.',
            ),
            body: 'onDebugAdapterProtocolTracker:${6:type}',
          },
          {
            label: 'workspaceContains',
            description: localize(
              'vscode.extension.activationEvents.workspaceContains',
              'An activation event emitted whenever a folder is opened that contains at least a file matching the specified glob pattern.',
            ),
            body: 'workspaceContains:${4:filePattern}',
          },
          {
            label: 'onFileSystem',
            description: localize(
              'vscode.extension.activationEvents.onFileSystem',
              'An activation event emitted whenever a file or folder is accessed with the given scheme.',
            ),
            body: 'onFileSystem:${1:scheme}',
          },
          {
            label: 'onSearch',
            description: localize(
              'vscode.extension.activationEvents.onSearch',
              'An activation event emitted whenever a search is started in the folder with the given scheme.',
            ),
            body: 'onSearch:${7:scheme}',
          },
          {
            label: 'onView',
            body: 'onView:${5:viewId}',
            description: localize(
              'vscode.extension.activationEvents.onView',
              'An activation event emitted whenever the specified view is expanded.',
            ),
          },
          {
            label: 'onUri',
            body: 'onUri',
            description: localize(
              'vscode.extension.activationEvents.onUri',
              'An activation event emitted whenever a system-wide Uri directed towards this extension is open.',
            ),
          },
          {
            label: '*',
            description: localize(
              'vscode.extension.activationEvents.star',
              'An activation event emitted on VS Code startup. To ensure a great end user experience, please use this activation event in your extension only when no other activation events combination works in your use-case.',
            ),
            body: '*',
          },
        ],
      },
    },
    badges: {
      type: 'array',
      description: localize(
        'vscode.extension.badges',
        "Array of badges to display in the sidebar of the Marketplace's extension page.",
      ),
      items: {
        type: 'object',
        required: ['url', 'href', 'description'],
        properties: {
          url: {
            type: 'string',
            description: localize('vscode.extension.badges.url', 'Badge image URL.'),
          },
          href: {
            type: 'string',
            description: localize('vscode.extension.badges.href', 'Badge link.'),
          },
          description: {
            type: 'string',
            description: localize('vscode.extension.badges.description', 'Badge description.'),
          },
        },
      },
    },
    markdown: {
      type: 'string',
      description: localize(
        'vscode.extension.markdown',
        'Controls the Markdown rendering engine used in the Marketplace. Either github (default) or standard.',
      ),
      enum: ['github', 'standard'],
      default: 'github',
    },
    qna: {
      default: 'marketplace',
      description: localize(
        'vscode.extension.qna',
        'Controls the Q&A link in the Marketplace. Set to marketplace to enable the default Marketplace Q & A site. Set to a string to provide the URL of a custom Q & A site. Set to false to disable Q & A altogether.',
      ),
      anyOf: [
        {
          type: ['string', 'boolean'],
          enum: ['marketplace', false],
        },
        {
          type: 'string',
        },
      ],
    },
    extensionDependencies: {
      description: localize(
        'vscode.extension.extensionDependencies',
        'Dependencies to other extensions. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp.',
      ),
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        pattern: EXTENSION_IDENTIFIER_PATTERN,
      },
    },
    extensionPack: {
      description: localize(
        'vscode.extension.contributes.extensionPack',
        'A set of extensions that can be installed together. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp.',
      ),
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        pattern: EXTENSION_IDENTIFIER_PATTERN,
      },
    },
    extensionKind: {
      description: localize(
        'extensionKind',
        'Define the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions are run on the remote.',
      ),
      type: 'string',
      enum: ['ui', 'workspace'],
      enumDescriptions: [
        localize(
          'ui',
          'UI extension kind. In a remote window, such extensions are enabled only when available on the local machine.',
        ),
        localize(
          'workspace',
          'Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote.',
        ),
      ],
      default: 'workspace',
    },
    scripts: {
      type: 'object',
      properties: {
        'vscode:prepublish': {
          description: localize(
            'vscode.extension.scripts.prepublish',
            'Script executed before the package is published as a VS Code extension.',
          ),
          type: 'string',
        },
        'vscode:uninstall': {
          description: localize(
            'vscode.extension.scripts.uninstall',
            'Uninstall hook for VS Code extension. Script that gets executed when the extension is completely uninstalled from VS Code which is when VS Code is restarted (shutdown and start) after the extension is uninstalled. Only Node scripts are supported.',
          ),
          type: 'string',
        },
      },
    },
    icon: {
      type: 'string',
      description: localize('vscode.extension.icon', 'The path to a 128x128 pixel icon.'),
    },
  },
};
