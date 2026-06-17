export async function httpPost<T>(url: string, body: unknown, token: string, correlationId?: string): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(correlationId && { 'X-Correlation-ID': correlationId }),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json() as any;

  if (!res.ok) {
    throw Object.assign(new Error(json?.error?.message ?? `HTTP ${res.status}`), {
      status: res.status,
      upstream: json,
    });
  }

  return json;
}

export async function httpGet<T>(url: string, token: string, correlationId?: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(correlationId && { 'X-Correlation-ID': correlationId }),
    },
  });

  const json = await res.json() as any;

  if (!res.ok) {
    throw Object.assign(new Error(json?.error?.message ?? `HTTP ${res.status}`), {
      status: res.status,
      upstream: json,
    });
  }

  return json;
}
