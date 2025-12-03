/**
 * Utility functions for extracting lab parameters from URL
 */
import { useState, useEffect } from 'react';

export interface LabParameters {
  labId?: string;
  sessionId?: string;
}

/**
 * Extract lab parameters from URL search params
 */
export function getLabParametersFromUrl(): LabParameters {
  if (typeof window === 'undefined') {
    return {}; // Server-side rendering
  }

  const urlParams = new URLSearchParams(window.location.search);
  const labId = urlParams.get('lab') || undefined;
  const sessionId = urlParams.get('session') || undefined;

  console.log('Extracted lab parameters from URL:', { labId, sessionId });

  return { labId, sessionId };
}

/**
 * Extract lab parameters from a specific URL string
 */
export function getLabParametersFromUrlString(url: string): LabParameters {
  try {
    const urlObj = new URL(url);
    const labId = urlObj.searchParams.get('lab') || undefined;
    const sessionId = urlObj.searchParams.get('session') || undefined;

    return { labId, sessionId };
  } catch (error) {
    console.error('Error parsing URL for lab parameters:', error);
    return {};
  }
}

/**
 * Build a URL with lab parameters
 */
export function buildLabUrl(baseUrl: string, labId: string, sessionId?: string): string {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('lab', labId);
  if (sessionId) {
    url.searchParams.set('session', sessionId);
  }
  return url.toString();
}

/**
 * Check if current URL has lab parameters
 */
export function hasLabParameters(): boolean {
  const { labId } = getLabParametersFromUrl();
  return !!labId;
}

/**
 * React hook for lab parameters (if using React hooks)
 */
export function useLabParameters(): LabParameters {
  const [params, setParams] = useState<LabParameters>(() => {
    if (typeof window !== 'undefined') {
      return getLabParametersFromUrl();
    }
    return {};
  });

  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        setParams(getLabParametersFromUrl());
      }
    };

    window.addEventListener('popstate', handleLocationChange);

    // Also check on mount in case URL changed
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return params;
}
