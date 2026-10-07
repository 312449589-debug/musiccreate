'use strict';
(() => {
  const config = window.XIANBAN_CONFIG || {};
  const base = String(config.apiBaseUrl || '/api/v1').replace(/\/+$/, '');
  const messages = {
    VALIDATION_ERROR: '请检查输入内容。', UNAUTHENTICATED: '请先登录，登录方式需由部署方配置。',
    FORBIDDEN: '你无权访问这个资源。', GENERATION_NOT_FOUND: '生成任务不存在或已不可用。',
    WORK_NOT_FOUND: '作品不存在或已不可用。', IDEMPOTENCY_KEY_REUSED: '请求标识已用于其他内容，请联系管理员排查。',
    GENERATION_NOT_READY: '音乐尚未生成完成，请稍后保存。', PROMPT_TOO_LARGE: '提示词过长，请缩短到 1200 个字符以内。',
    RATE_LIMITED: '请求过于频繁，请稍后重试。', GENERATION_PROVIDER_ERROR: '音乐生成服务暂时不可用，请稍后重试。',
    SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试。', INTERNAL_ERROR: '服务出现错误，请稍后重试。',
    NETWORK_ERROR: '网络连接失败，已保留当前内容。', INVALID_RESPONSE: '服务器响应格式不符合接口约定。',
    TIMEOUT: '请求超时，已保留当前内容。'
  };
  class ApiError extends Error {
    constructor(code, status = 0, extra = {}) {
      super(messages[code] || '请求失败，请稍后重试。');
      Object.assign(this, {code, status, ...extra});
    }
  }
  const retryAfter = value => {
    if (!value) return null;
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, n * 1000) : Math.max(0, Date.parse(value) - Date.now()) || null;
  };
  let rateLimitedUntil = 0;
  async function request(path, {method = 'GET', body, idempotencyKey} = {}) {
    if (Date.now() < rateLimitedUntil) throw new ApiError('RATE_LIMITED', 429, {waitMs: rateLimitedUntil - Date.now()});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const headers = {Accept: 'application/json'};
      if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      const token = await config.getAccessToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${base}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'same-origin', signal: controller.signal, cache: 'no-store'
      });
      const waitMs = retryAfter(response.headers.get('Retry-After'));
      if (response.status === 429) rateLimitedUntil = Date.now() + (waitMs ?? 2000);
      let data;
      try { data = await response.json(); } catch {
        if (!response.ok) throw new ApiError(response.status === 401 ? 'UNAUTHENTICATED' : 'SERVICE_UNAVAILABLE', response.status, {waitMs});
        throw new ApiError('INVALID_RESPONSE', response.status);
      }
      if (!response.ok) {
        const error = new ApiError(data?.error?.code || 'INTERNAL_ERROR', response.status, {
          details: data?.error?.details, requestId: data?.error?.request_id, waitMs
        });
        throw error;
      }
      return {data, waitMs};
    } catch (error) {
      const mapped = error instanceof ApiError ? error : new ApiError(error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR');
      if (mapped.status === 401) config.onUnauthorized?.();
      throw mapped;
    } finally { clearTimeout(timer); }
  }
  const id = value => encodeURIComponent(value);
  window.XianbanApi = {
    base, ApiError, messages, request,
    createGeneration: (body, key) => request('/generations', {method: 'POST', body, idempotencyKey: key}),
    getGeneration: key => request(`/generations/${id(key)}`),
    saveWork: body => request('/works', {method: 'POST', body}),
    listWorks: cursor => request(`/works?${new URLSearchParams({limit: '20', ...(cursor ? {cursor} : {})})}`),
    getWork: key => request(`/works/${id(key)}`),
    practice: (key, body) => request(`/works/${id(key)}/practice-sessions`, {method: 'POST', body})
  };
})();
