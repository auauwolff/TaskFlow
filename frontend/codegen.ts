import type { CodegenConfig } from '@graphql-codegen/cli'

// The schema snapshot is exported from the backend's executable schema
// (`pnpm generate:graphql` runs `dotnet run -- schema export` first), so the generated types can
// never drift from what the server actually serves — the GraphQL twin of `generate:api`.
const config: CodegenConfig = {
  schema: 'src/shared/graphql/schema.graphql',
  documents: ['src/features/**/adapters/*.ts'],
  generates: {
    'src/shared/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        // Gateways map DTOs to domain objects immediately at the adapter boundary; fragment
        // masking's useFragment() indirection targets components reading fragments directly,
        // which this architecture forbids anyway.
        fragmentMasking: false,
      },
      config: {
        // Plain strings keep the client transport dependency-free: TypedDocumentString carries
        // the operation types at compile time and serializes as an ordinary string at runtime.
        documentMode: 'string',
        enumsAsTypes: true,
        useTypeImports: true,
        skipTypename: true,
        scalars: {
          UUID: 'string',
          DateTime: 'string',
        },
      },
    },
  },
}

export default config
