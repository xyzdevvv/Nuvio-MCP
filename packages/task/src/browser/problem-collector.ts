/** ******************************************************************************
 * Copyright (C) 2019 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

// Some code copied and modified from https://github.com/eclipse-theia/theia/tree/v1.14.0/packages/task/src/node/task-problem-collector.ts

import { ProblemMatch, ProblemMatcher } from '@Nuvio-MCP/ide-core-common';

import { AbstractLineMatcher, StartStopLineMatcher, WatchModeLineMatcher } from './problem-line-matcher';

export function isWatchModeWatcher(matcher: ProblemMatcher): boolean {
  return !!matcher.watching;
}

export class ProblemCollector {
  private lineMatchers: AbstractLineMatcher[] = [];

  constructor(public problemMatchers: ProblemMatcher[]) {
    for (const matcher of problemMatchers) {
      if (isWatchModeWatcher(matcher)) {
        this.lineMatchers.push(new WatchModeLineMatcher(matcher));
      } else {
        this.lineMatchers.push(new StartStopLineMatcher(matcher));
      }
    }
  }

  processLine(line: string): ProblemMatch[] {
    const markers: ProblemMatch[] = [];
    this.lineMatchers.forEach((lineMatcher) => {
      const match = lineMatcher.match(line);
      if (match) {
        markers.push(match);
      }
    });
    return markers;
  }

  isTaskActiveOnStart(): boolean {
    const activeOnStart = this.lineMatchers.some(
      (lineMatcher) => lineMatcher instanceof WatchModeLineMatcher && lineMatcher.activeOnStart,
    );
    return activeOnStart;
  }

  matchBeginMatcher(line: string): boolean {
    const match = this.lineMatchers.some(
      (lineMatcher) => lineMatcher instanceof WatchModeLineMatcher && lineMatcher.matchBegin(line),
    );
    return match;
  }

  matchEndMatcher(line: string): boolean {
    const match = this.lineMatchers.some(
      (lineMatcher) => lineMatcher instanceof WatchModeLineMatcher && lineMatcher.matchEnd(line),
    );
    return match;
  }
}
