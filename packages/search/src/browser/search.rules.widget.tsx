import cls from 'classnames';
import React from 'react';

import { CheckBox, Input, Popover, PopoverPosition, PopoverTriggerType } from '@Nuvio-MCP/ide-components';
import { ConfigContext } from '@Nuvio-MCP/ide-core-browser/lib/react-providers/config-provider';
import { getExternalIcon, getIcon } from '@Nuvio-MCP/ide-core-browser/lib/style/icon/icon';
import { localize } from '@Nuvio-MCP/ide-core-common/lib/localize';

import { IContentSearchClientService } from '../common/content-search';

import styles from './search.module.less';

const IncludeRuleContent = () => (
  <div className={cls(styles.include_rule_content)}>
    <ul>
      <li>, : {localize('search.help.concatRule')}</li>
      <li>* : {localize('search.help.matchOneOrMoreRule')}</li>
      <li>? : {localize('search.help.matchOne')}</li>
      <li>** : {localize('search.help.matchAny')}</li>
      <li>
        {} : {localize('search.help.matchWithGroup')}
      </li>
      <li>[] : {localize('search.help.matchRange')}</li>
    </ul>
  </div>
);

const ExcludeRuleContent = React.memo(() => {
  const configContext = React.useContext(ConfigContext);
  const { injector } = configContext;
  const searchBrowserService = injector.get(IContentSearchClientService);
  const excludeList = React.useMemo(() => searchBrowserService.getPreferenceSearchExcludes(), [searchBrowserService]);

  return (
    <div className={cls(styles.exclude_rule_content)}>
      <div>
        {excludeList.map((exclude, index) => {
          if (index === excludeList.length - 1) {
            return exclude;
          }
          return `${exclude}, `;
        })}
      </div>
    </div>
  );
});

interface SearchRulesWidgetProps {
  includeValue: string;
  excludeValue: string;
  onChangeInclude(e: React.FormEvent<HTMLInputElement>): void;
  onChangeExclude(e: React.FormEvent<HTMLInputElement>): void;
  isOnlyOpenEditors: boolean;
  onOnlyOpenEditorsToggle(): void;
  isIncludeIgnored: boolean;
  onIncludeIgnoredToggle(): void;
  onSearch(): void;
  onOpenPreference(): void;
}

const IncludeInput = React.memo(
  ({
    includeValue,
    isOnlyOpenEditors,
    onSearch,
    onChangeInclude,
    onOnlyOpenEditorsToggle,
  }: Pick<
    SearchRulesWidgetProps,
    'includeValue' | 'onSearch' | 'onChangeInclude' | 'isOnlyOpenEditors' | 'onOnlyOpenEditorsToggle'
  >) => (
    <div className={cls(styles.glob_field)}>
      <div className={cls(styles.label)}>
        <span className={styles.limit}>{localize('search.includes')}</span>
        <span className={cls(styles.include_rule)}>
          <Popover
            id={'show_include_rule'}
            title={localize('search.help.supportRule')}
            content={<IncludeRuleContent />}
            trigger={PopoverTriggerType.hover}
            delay={0.5}
            position={PopoverPosition.right}
          >
            <a>{localize('search.help.showIncludeRule')}</a>
          </Popover>
        </span>
      </div>
      <Input
        value={includeValue}
        type='text'
        placeholder={localize('search.includes.description')}
        onKeyUp={onSearch}
        onChange={onChangeInclude}
        id='include-input-field'
        addonAfter={[
          <span
            key='onlyOpenEditors'
            className={cls(getExternalIcon('book'), styles.search_option, { [styles.select]: isOnlyOpenEditors })}
            title={localize('search.onlyOpenEditors')}
            onClick={onOnlyOpenEditorsToggle}
          />,
        ]}
      />
    </div>
  ),
  (prevProps, nextProps) =>
    prevProps.includeValue === nextProps.includeValue && prevProps.isOnlyOpenEditors === nextProps.isOnlyOpenEditors,
);

const ExcludeInput = React.memo(
  ({
    isIncludeIgnored,
    excludeValue,
    onIncludeIgnoredToggle,
    onChangeExclude,
    onOpenPreference,
    onSearch,
  }: Pick<
    SearchRulesWidgetProps,
    'isIncludeIgnored' | 'onIncludeIgnoredToggle' | 'onOpenPreference' | 'excludeValue' | 'onSearch' | 'onChangeExclude'
  >) => (
    <div className={cls(styles.glob_field, styles.search_excludes)}>
      <div className={styles.label}>
        <span className={styles.limit}>{localize('search.excludes')}</span>
        <div className={styles.use_default_excludes_wrapper}>
          <CheckBox
            className={cls(styles.checkbox)}
            label={localize('search.excludes.default.enable')}
            checked={!isIncludeIgnored}
            id='search-input-isIncludeIgnored'
            onChange={onIncludeIgnoredToggle}
          />
          <Popover
            title={localize('search.help.excludeList')}
            overlayClassName={cls(styles.search_excludes_description)}
            id={'search_excludes'}
            action={localize('search.help.modify')}
            onClickAction={onOpenPreference}
            content={<ExcludeRuleContent />}
            trigger={PopoverTriggerType.hover}
            delay={0.5}
            position={PopoverPosition.right}
          >
            <span
              className={cls(getIcon('question-circle'), styles.search_option)}
              style={{ opacity: '0.7', cursor: 'pointer' }}
            />
          </Popover>
        </div>
      </div>
      <Input
        type='text'
        value={excludeValue}
        placeholder={localize('search.includes.description')}
        onKeyUp={onSearch}
        onChange={onChangeExclude}
        id='exclude-input-field'
      />
    </div>
  ),
  (prevProps, nextProps) =>
    prevProps.excludeValue === nextProps.excludeValue && prevProps.isIncludeIgnored === nextProps.isIncludeIgnored,
);

function isSearchRulesPropsEqual(prevProps: SearchRulesWidgetProps, nextProps: SearchRulesWidgetProps) {
  return (
    prevProps.includeValue === nextProps.includeValue &&
    prevProps.excludeValue === nextProps.excludeValue &&
    prevProps.isOnlyOpenEditors === nextProps.isOnlyOpenEditors &&
    prevProps.isIncludeIgnored === nextProps.isIncludeIgnored
  );
}

export const SearchRulesWidget = React.memo(
  ({
    includeValue,
    excludeValue,
    onChangeExclude,
    onChangeInclude,
    isOnlyOpenEditors,
    onOnlyOpenEditorsToggle,
    isIncludeIgnored,
    onIncludeIgnoredToggle,
    onSearch,
    onOpenPreference,
  }: SearchRulesWidgetProps) => (
    <div className='glob_field-container'>
      <IncludeInput
        includeValue={includeValue}
        onSearch={onSearch}
        onChangeInclude={onChangeInclude}
        isOnlyOpenEditors={isOnlyOpenEditors}
        onOnlyOpenEditorsToggle={onOnlyOpenEditorsToggle}
      />
      <ExcludeInput
        isIncludeIgnored={isIncludeIgnored}
        excludeValue={excludeValue}
        onIncludeIgnoredToggle={onIncludeIgnoredToggle}
        onChangeExclude={onChangeExclude}
        onOpenPreference={onOpenPreference}
        onSearch={onSearch}
      />
    </div>
  ),
  isSearchRulesPropsEqual,
);
