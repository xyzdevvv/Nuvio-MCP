import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IJSONSchema, IJSONSchemaMap, ILogger, localize } from '@Nuvio-MCP/ide-core-browser';
import { ITaskDefinitionRegistry, LifeCyclePhase } from '@Nuvio-MCP/ide-core-common';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';

export const taskDefinitionSchema: IJSONSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: {
      type: 'string',
      description: localize(
        'TaskDefinition.description',
        "The actual task type. Please note that types starting with a '$' are reserved for internal usage.",
      ),
    },
    required: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    properties: {
      type: 'object',
      description: localize('TaskDefinition.properties', 'Additional properties of the task type'),
      additionalProperties: {
        $ref: 'http://json-schema.org/draft-04/schema#',
      },
    },
  },
};

export interface TaskDefinition {
  type: string;
  required: string[];
  properties: IJSONSchemaMap;
}

export type ITaskDefinitionSchema = Array<TaskDefinition>;

@Injectable()
@Contributes('taskDefinitions')
@LifeCycle(LifeCyclePhase.Ready)
export class TaskDefinitionContributionPoint extends VSCodeContributePoint<ITaskDefinitionSchema> {
  phase: LifeCyclePhase = LifeCyclePhase.Starting;

  @Autowired(ITaskDefinitionRegistry)
  taskDefinitionRegistry: ITaskDefinitionRegistry;

  @Autowired(ILogger)
  logger: ILogger;

  contribute() {
    for (const contrib of this.contributesMap) {
      const { extensionId, contributes } = contrib;
      for (const definition of contributes) {
        this.logger.verbose(`${extensionId} register taskDefinition ${JSON.stringify(definition)}`);
        this.addDispose(
          this.taskDefinitionRegistry.register(definition.type, {
            ...definition,
            taskType: definition.type,
            extensionId,
          }),
        );
      }
    }
  }
}
