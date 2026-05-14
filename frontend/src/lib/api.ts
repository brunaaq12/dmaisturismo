const BASE_URL = "https://d-turismo-api.cvilmap-cloud-bruna.workers.dev";

export const api = {
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('d_turismo_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const text = await response.text(); // Pega a resposta como texto bruto primeiro

    let data;
    try {
      data = JSON.parse(text); // Tenta transformar em JSON
    } catch (e) {
      // Se não for JSON (como um erro da Cloudflare), mostra a mensagem real
      throw new Error(text || 'Erro na requisição. O servidor não retornou um formato válido.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data as T;
  },

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  },

  post<T>(path: string, body: any) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },

  put<T>(path: string, body: any) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  },

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  },
};
