/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type AssignTaskInput = {
  assigneeId: string;
};

export type CreateTaskInput = {
  description?: string | null | undefined;
  priority: TaskPriority;
  projectId: string;
  title: string;
};

export type TaskItemStatus =
  | 'DONE'
  | 'IN_PROGRESS'
  | 'TODO';

export type TaskPriority =
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type TaskFieldsFragment = { id: string, projectId: string, title: string, description: string | null, status: TaskItemStatus, priority: TaskPriority, assigneeId: string | null, createdAt: string, completedAt: string | null };

export type TasksQueryVariables = Exact<{
  projectId: string;
}>;


export type TasksQuery = { tasks: Array<{ id: string, projectId: string, title: string, description: string | null, status: TaskItemStatus, priority: TaskPriority, assigneeId: string | null, createdAt: string, completedAt: string | null }> };

export type CreateTaskMutationVariables = Exact<{
  input: CreateTaskInput;
}>;


export type CreateTaskMutation = { task: { id: string, projectId: string, title: string, description: string | null, status: TaskItemStatus, priority: TaskPriority, assigneeId: string | null, createdAt: string, completedAt: string | null } };

export type CompleteTaskMutationVariables = Exact<{
  id: string;
}>;


export type CompleteTaskMutation = { task: { id: string, projectId: string, title: string, description: string | null, status: TaskItemStatus, priority: TaskPriority, assigneeId: string | null, createdAt: string, completedAt: string | null } };

export type AssignTaskMutationVariables = Exact<{
  id: string;
  input: AssignTaskInput;
}>;


export type AssignTaskMutation = { task: { id: string, projectId: string, title: string, description: string | null, status: TaskItemStatus, priority: TaskPriority, assigneeId: string | null, createdAt: string, completedAt: string | null } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const TaskFieldsFragmentDoc = new TypedDocumentString(`
    fragment TaskFields on TaskItemDto {
  id
  projectId
  title
  description
  status
  priority
  assigneeId
  createdAt
  completedAt
}
    `, {"fragmentName":"TaskFields"}) as unknown as TypedDocumentString<TaskFieldsFragment, unknown>;
export const TasksDocument = new TypedDocumentString(`
    query Tasks($projectId: UUID!) {
  tasks(projectId: $projectId) {
    ...TaskFields
  }
}
    fragment TaskFields on TaskItemDto {
  id
  projectId
  title
  description
  status
  priority
  assigneeId
  createdAt
  completedAt
}`) as unknown as TypedDocumentString<TasksQuery, TasksQueryVariables>;
export const CreateTaskDocument = new TypedDocumentString(`
    mutation CreateTask($input: CreateTaskInput!) {
  task: createTask(input: $input) {
    ...TaskFields
  }
}
    fragment TaskFields on TaskItemDto {
  id
  projectId
  title
  description
  status
  priority
  assigneeId
  createdAt
  completedAt
}`) as unknown as TypedDocumentString<CreateTaskMutation, CreateTaskMutationVariables>;
export const CompleteTaskDocument = new TypedDocumentString(`
    mutation CompleteTask($id: UUID!) {
  task: completeTask(id: $id) {
    ...TaskFields
  }
}
    fragment TaskFields on TaskItemDto {
  id
  projectId
  title
  description
  status
  priority
  assigneeId
  createdAt
  completedAt
}`) as unknown as TypedDocumentString<CompleteTaskMutation, CompleteTaskMutationVariables>;
export const AssignTaskDocument = new TypedDocumentString(`
    mutation AssignTask($id: UUID!, $input: AssignTaskInput!) {
  task: assignTask(id: $id, input: $input) {
    ...TaskFields
  }
}
    fragment TaskFields on TaskItemDto {
  id
  projectId
  title
  description
  status
  priority
  assigneeId
  createdAt
  completedAt
}`) as unknown as TypedDocumentString<AssignTaskMutation, AssignTaskMutationVariables>;