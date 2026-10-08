import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

/**
 * GET `url` on mount and whenever it changes. `select` maps the response body.
 * Returns { data, error, loading, reload, setData }. Pass url = null to skip.
 */
export default function useApi(url, select = (body) => body.data) {
  const [state, setState] = useState({ data: undefined, error: null, loading: !!url });
  const selectRef = useRef(select);
  selectRef.current = select;
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!url) return undefined;
    const id = ++seq.current;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const body = await api.get(url);
      const data = selectRef.current(body);
      if (id === seq.current) setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      if (id === seq.current) setState(s => ({ ...s, error, loading: false }));
      return undefined;
    }
  }, [url]);

  useEffect(() => {
    reload();
    // Bumping the counter (not reading a DOM ref) makes any in-flight response stale on unmount/url change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { seq.current++; };
  }, [reload]);

  const setData = useCallback((updater) => {
    setState(s => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload, setData };
}
