import { createCompositeDocumentRepository } from '../infrastructure/compositeDocumentRepository';
import { createInMemoryDocumentStore } from '../infrastructure/inMemoryDocumentStore';
import { DocumentsDependencies } from '../ui/documentsContext';

export function testDependencies(
  overrides: Partial<DocumentsDependencies> = {},
): DocumentsDependencies {
  const store = createInMemoryDocumentStore();

  return {
    reader: createCompositeDocumentRepository([store]),
    store,
    newId: () => 'generated-id',
    now: () => new Date('2026-08-17T10:00:00Z'),
    pickFile: async () => null,
    ...overrides,
  };
}
