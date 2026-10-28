// Pembungkus fetch untuk API. Header X-Requested-With wajib untuk permintaan yang mengubah data.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'rancang-prd',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'Tidak bisa terhubung ke server. Periksa koneksimu.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* badan kosong atau bukan JSON */
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code || 'error', data?.error?.message || 'Terjadi kesalahan. Coba lagi.');
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  del: (path) => request('DELETE', path),
};

// Hanya berguna di mode pratinjau (lihat api.demo.js). Di versi dengan server, tidak melakukan apa-apa.
export function resetDemo() {}
