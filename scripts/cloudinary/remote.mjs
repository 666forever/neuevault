export async function listNamespace(transport, prefix = 'neuevault/') {
  const resources = [];
  for (const type of ['upload', 'authenticated']) {
    let nextCursor;
    do { const page = await transport.list({ prefix, type, nextCursor }); resources.push(...(page.resources || [])); nextCursor = page.next_cursor; } while (nextCursor);
  }
  return resources;
}
