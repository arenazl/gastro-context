import { useState, useEffect } from 'react';

interface VersionInfo {
  version: string;
  lastCommit?: string;
  lastUpdate?: string;
}

export const useVersion = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({ version: '0.1.0' });

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(() => {
        // Si no puede cargar el archivo, usar versión por defecto
        setVersionInfo({ version: '0.1.0' });
      });
  }, []);

  return versionInfo;
};