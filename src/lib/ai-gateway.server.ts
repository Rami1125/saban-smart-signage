const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function getLovableAiGatewayRunId(request: Request): string | undefined {
  return request.headers.get(RUN_ID_HEADER) ?? undefined;
}

export type RunIdFetch = {
  fetch: typeof fetch;
  getRunId: () => string | undefined;
};

export function createLovableAiGatewayRunIdFetch(initialRunId?: string): RunIdFetch {
  let runId = initialRunId;
  const wrapped: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set(RUN_ID_HEADER, runId);
    const response = await fetch(input as RequestInfo, { ...init, headers });
    const returned = response.headers.get(RUN_ID_HEADER);
    if (returned) runId = returned;
    return response;
  };
  return { fetch: wrapped, getRunId: () => runId };
}

export function getLovableAiGatewayResponseHeaders(
  _unused?: unknown,
  extra?: Record<string, string>,
): Record<string, string> {
  return { ...(extra ?? {}) };
}

export function withLovableAiGatewayRunIdHeader(
  response: Response,
  runIdFetch: RunIdFetch,
): Response {
  const runId = runIdFetch.getRunId();
  if (!runId) return response;
  const headers = new Headers(response.headers);
  headers.set(RUN_ID_HEADER, runId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
