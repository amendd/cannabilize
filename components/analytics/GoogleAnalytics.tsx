'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

interface AnalyticsConfig {
  enabled: boolean;
  measurementId: string | null;
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [config, setConfig] = useState<AnalyticsConfig>({ enabled: false, measurementId: null });
  const lastSentPath = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/config/analytics')
      .then((res) => res.json())
      .then((data) => setConfig({ enabled: !!data.enabled, measurementId: data.measurementId || null }))
      .catch(() => setConfig({ enabled: false, measurementId: null }));
  }, []);

  useEffect(() => {
    if (!config.enabled || !config.measurementId) return;
    const id = config.measurementId;
    const path = pathname || '/';
    const sendPageView = () => {
      if (typeof window.gtag !== 'function') return;
      if (lastSentPath.current === path) return;
      lastSentPath.current = path;
      window.gtag('config', id, {
        page_path: path,
        page_title: document.title,
      });
    };
    lastSentPath.current = null;
    sendPageView();
    const t1 = setTimeout(sendPageView, 400);
    const t2 = setTimeout(sendPageView, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [config.enabled, config.measurementId, pathname]);

  if (!config.enabled || !config.measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', '${config.measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
