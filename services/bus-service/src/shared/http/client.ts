export async function httpPost<T>(url: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

export async function httpGet<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
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
