/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment TaskFields on TaskItemDto {\n    id\n    projectId\n    title\n    description\n    status\n    priority\n    assigneeId\n    createdAt\n    completedAt\n  }\n": typeof types.TaskFieldsFragmentDoc,
    "\n  query Tasks($projectId: UUID!) {\n    tasks(projectId: $projectId) {\n      ...TaskFields\n    }\n  }\n": typeof types.TasksDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    task: createTask(input: $input) {\n      ...TaskFields\n    }\n  }\n": typeof types.CreateTaskDocument,
    "\n  mutation CompleteTask($id: UUID!) {\n    task: completeTask(id: $id) {\n      ...TaskFields\n    }\n  }\n": typeof types.CompleteTaskDocument,
    "\n  mutation AssignTask($id: UUID!, $input: AssignTaskInput!) {\n    task: assignTask(id: $id, input: $input) {\n      ...TaskFields\n    }\n  }\n": typeof types.AssignTaskDocument,
};
const documents: Documents = {
    "\n  fragment TaskFields on TaskItemDto {\n    id\n    projectId\n    title\n    description\n    status\n    priority\n    assigneeId\n    createdAt\n    completedAt\n  }\n": types.TaskFieldsFragmentDoc,
    "\n  query Tasks($projectId: UUID!) {\n    tasks(projectId: $projectId) {\n      ...TaskFields\n    }\n  }\n": types.TasksDocument,
    "\n  mutation CreateTask($input: CreateTaskInput!) {\n    task: createTask(input: $input) {\n      ...TaskFields\n    }\n  }\n": types.CreateTaskDocument,
    "\n  mutation CompleteTask($id: UUID!) {\n    task: completeTask(id: $id) {\n      ...TaskFields\n    }\n  }\n": types.CompleteTaskDocument,
    "\n  mutation AssignTask($id: UUID!, $input: AssignTaskInput!) {\n    task: assignTask(id: $id, input: $input) {\n      ...TaskFields\n    }\n  }\n": types.AssignTaskDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TaskFields on TaskItemDto {\n    id\n    projectId\n    title\n    description\n    status\n    priority\n    assigneeId\n    createdAt\n    completedAt\n  }\n"): typeof import('./graphql').TaskFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Tasks($projectId: UUID!) {\n    tasks(projectId: $projectId) {\n      ...TaskFields\n    }\n  }\n"): typeof import('./graphql').TasksDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTask($input: CreateTaskInput!) {\n    task: createTask(input: $input) {\n      ...TaskFields\n    }\n  }\n"): typeof import('./graphql').CreateTaskDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteTask($id: UUID!) {\n    task: completeTask(id: $id) {\n      ...TaskFields\n    }\n  }\n"): typeof import('./graphql').CompleteTaskDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AssignTask($id: UUID!, $input: AssignTaskInput!) {\n    task: assignTask(id: $id, input: $input) {\n      ...TaskFields\n    }\n  }\n"): typeof import('./graphql').AssignTaskDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
