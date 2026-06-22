const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API Error: ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    return res as unknown as T;
  }

  return res.json();
}

export const api = {
  users: {
    list: () => request<any[]>('/users'),
  },

  projects: {
    list: () => request<any[]>('/projects'),
    get: (id: string) => request<any>(`/projects/${id}`),
    create: (data: { title: string; description: string; creatorId: string }) =>
      request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<any>) =>
      request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  },

  chapters: {
    list: (projectId: string) => request<any[]>(`/projects/${projectId}/chapters`),
    get: (id: string) => request<any>(`/chapters/${id}`),
    create: (projectId: string, data: { title: string; parentId?: string }) =>
      request<any>(`/projects/${projectId}/chapters`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { content?: string; title?: string }) =>
      request<any>(`/chapters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/chapters/${id}`, { method: 'DELETE' }),
    lock: (id: string, userId: string) =>
      request<any>(`/chapters/${id}/lock`, { method: 'POST', body: JSON.stringify({ userId }) }),
    unlock: (id: string) =>
      request<any>(`/chapters/${id}/unlock`, { method: 'POST' }),
    releaseExpired: () =>
      request<any>('/chapters/release-expired', { method: 'POST' }),
  },

  versions: {
    list: (chapterId: string) => request<any[]>(`/chapters/${chapterId}/history`),
    create: (chapterId: string, data: { content: string; authorId: string; changeSummary: string }) =>
      request<any>(`/chapters/${chapterId}/versions`, { method: 'POST', body: JSON.stringify(data) }),
    revert: (versionId: string) =>
      request<any>(`/versions/${versionId}/revert`, { method: 'POST' }),
    diff: (oldContent: string, newContent: string) =>
      request<any>(`/versions/diff?oldContent=${encodeURIComponent(oldContent)}&newContent=${encodeURIComponent(newContent)}`),
  },

  characters: {
    list: (projectId: string) => request<any[]>(`/projects/${projectId}/characters`),
    get: (id: string) => request<any>(`/characters/${id}`),
    create: (projectId: string, data: any) =>
      request<any>(`/projects/${projectId}/characters`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<any>) =>
      request<any>(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/characters/${id}`, { method: 'DELETE' }),
  },

  plot: {
    list: (projectId: string) => request<any[]>(`/projects/${projectId}/plot`),
    create: (projectId: string, data: any) =>
      request<any>(`/projects/${projectId}/plot`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<any>) =>
      request<any>(`/plot/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/plot/${id}`, { method: 'DELETE' }),
    addHint: (plotPointId: string, data: any) =>
      request<any>(`/plot/${plotPointId}/hints`, { method: 'POST', body: JSON.stringify(data) }),
  },

  conflicts: {
    check: (projectId: string, chapterId: string) =>
      request<any[]>(`/projects/${projectId}/plot/check`, { method: 'POST', body: JSON.stringify({ chapterId }) }),
    resolve: (id: string) =>
      request<{ success: boolean }>(`/conflicts/${id}/resolve`, { method: 'PUT' }),
    applyFix: (conflictId: string, suggestionId: string) =>
      request<any>(`/conflicts/${conflictId}/apply-fix`, { method: 'POST', body: JSON.stringify({ suggestionId }) }),
  },

  customRules: {
    list: (projectId: string) =>
      request<any[]>(`/projects/${projectId}/custom-rules`),
    get: (id: string) =>
      request<any>(`/custom-rules/${id}`),
    create: (projectId: string, data: any) =>
      request<any>(`/projects/${projectId}/custom-rules`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/custom-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id: string) =>
      request<{ success: boolean; isEnabled: boolean }>(`/custom-rules/${id}/toggle`, { method: 'PUT' }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/custom-rules/${id}`, { method: 'DELETE' }),
  },

  timeline: {
    list: (projectId: string) =>
      request<any[]>(`/projects/${projectId}/timeline`),
  },

  locations: {
    list: (projectId: string) =>
      request<any[]>(`/projects/${projectId}/locations`),
  },

  export: {
    pdf: (config: any) => request<any>('/export/pdf', { method: 'POST', body: JSON.stringify(config) }),
  },

  notes: {
    list: (projectId: string) => request<any[]>(`/projects/${projectId}/notes`),
    create: (projectId: string, data: Partial<any>) =>
      request<any>(`/projects/${projectId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<any>) =>
      request<any>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updatePosition: (id: string, data: { positionX?: number; positionY?: number; zIndex?: number; rotation?: number }) =>
      request<any>(`/notes/${id}/position`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/notes/${id}`, { method: 'DELETE' }),
    reorder: (projectId: string, noteIds: string[]) =>
      request<any>(`/projects/${projectId}/notes/reorder`, { method: 'PUT', body: JSON.stringify({ noteIds }) }),
  },

  branches: {
    list: (chapterId: string) => request<any[]>(`/chapters/${chapterId}/branches`),
    get: (branchId: string) => request<any>(`/branches/${branchId}`),
    create: (chapterId: string, data: {
      name: string;
      description?: string;
      parentBranchId?: string;
      color?: string;
      baseVersionId?: string;
    }) =>
      request<any>(`/chapters/${chapterId}/branches`, { method: 'POST', body: JSON.stringify(data) }),
    update: (branchId: string, data: { name?: string; description?: string; status?: string }) =>
      request<any>(`/branches/${branchId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (branchId: string) =>
      request<{ success: boolean }>(`/branches/${branchId}`, { method: 'DELETE' }),
    versions: (branchId: string) => request<any[]>(`/branches/${branchId}/versions`),
    createVersion: (branchId: string, data: { content: string; summary: string }) =>
      request<any>(`/branches/${branchId}/versions`, { method: 'POST', body: JSON.stringify(data) }),
    merge: (sourceBranchId: string, targetBranchId: string, resolutions?: Record<string, string>) =>
      request<any>(`/branches/${sourceBranchId}/merge`, {
        method: 'POST',
        body: JSON.stringify({ targetBranchId, resolutions }),
      }),
    diff: (branchAId: string, branchBId: string) =>
      request<any>(`/branches/diff?branchAId=${branchAId}&branchBId=${branchBId}`),
  },

  connections: {
    list: (projectId: string) => request<any[]>(`/projects/${projectId}/connections`),
    create: (projectId: string, data: {
      sourceNoteId: string;
      targetNoteId: string;
      type?: string;
      label?: string;
      description?: string;
      color?: string;
    }) =>
      request<any>(`/projects/${projectId}/connections`, { method: 'POST', body: JSON.stringify(data) }),
    update: (connectionId: string, data: {
      type?: string;
      label?: string;
      description?: string;
      color?: string;
    }) =>
      request<any>(`/connections/${connectionId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (connectionId: string) =>
      request<{ success: boolean }>(`/connections/${connectionId}`, { method: 'DELETE' }),
    getRecommendations: (projectId: string, threshold?: number) =>
      request<any[]>(`/projects/${projectId}/connections/recommendations${threshold !== undefined ? `?threshold=${threshold}` : ''}`),
  },
};
