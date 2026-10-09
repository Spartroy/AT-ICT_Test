// What a material is: a book, a revision sheet, or a box of practical source files.
// Source files are always practical. `isSourceFile` is kept in sync for older clients/documents.

const KINDS = ['book', 'revsheet', 'source'];

/**
 * Works out kind / type / isSourceFile from a request body, falling back to the stored document.
 * Multipart bodies send booleans as strings, hence the String() comparison.
 */
function resolveKind(input = {}, current = {}) {
  let kind = KINDS.includes(input.kind) ? input.kind : undefined;
  if (!kind && input.isSourceFile !== undefined) kind = String(input.isSourceFile) === 'true' ? 'source' : 'book';
  if (!kind) kind = KINDS.includes(current.kind) ? current.kind : (current.isSourceFile ? 'source' : 'book');
  const type = kind === 'source' ? 'practical' : (input.type || current.type);
  return { kind, type, isSourceFile: kind === 'source' };
}

module.exports = { KINDS, resolveKind };
