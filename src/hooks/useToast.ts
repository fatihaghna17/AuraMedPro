import { useState, useCallback } from 'react';

export function useToast() {
  const [toastMessage, setToastMessage] = useState<{text:string;icon?:string}|null>(null);
  const triggerToast = useCallback((text: string, icon = 'ℹ️') => {
    setToastMessage({ text, icon });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);
  return { toastMessage, triggerToast };
}
