import React from 'react';
import ReactDOM from 'react-dom';

import { createMarkedRenderer, toMarkdownHtml } from '@Nuvio-MCP/ide-components/lib/utils';
import { IMarkdownString } from '@Nuvio-MCP/ide-core-browser';

import styles from './comments.module.less';
import { markdownCss } from './markdown.style';

const ShadowContent = ({ root, children }) => ReactDOM.createPortal(children, root);

export const CommentsBody: React.FC<{
  body: string | IMarkdownString;
}> = React.memo(({ body }) => {
  const shadowRootRef = React.useRef<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null);

  const renderer = React.useMemo(() => {
    const renderer = createMarkedRenderer();

    renderer.link = (href, title, text) =>
      `<a target="_blank" rel="noopener" href="${href}" title="${title}">${text}</a>`;
    return renderer;
  }, []);

  React.useEffect(() => {
    if (shadowRootRef.current) {
      const shadowRootElement = shadowRootRef.current.attachShadow({ mode: 'open' });
      if (!shadowRoot) {
        setShadowRoot(shadowRootElement);
      }
    }
  }, []);

  return (
    <div ref={shadowRootRef} className={styles.comment_shadow_box}>
      {shadowRoot && (
        <ShadowContent root={shadowRoot}>
          <style>{markdownCss}</style>
          <div
            dangerouslySetInnerHTML={{
              __html: toMarkdownHtml(typeof body === 'string' ? body : body.value, {
                gfm: true,
                breaks: false,
                pedantic: false,
                smartLists: true,
                smartypants: false,
                renderer,
              }),
            }}
          ></div>
        </ShadowContent>
      )}
    </div>
  );
});
