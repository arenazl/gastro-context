export const formatDateTime = (
  date: Date | string,
  timezone = 'America/Argentina/Buenos_Aires',
  dateFormat = 'DD/MM/YYYY',
  timeFormat: '12h' | '24h' = '24h'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h'
  };

  const formatter = new Intl.DateTimeFormat('es-AR', options);
  const formatted = formatter.format(dateObj);

  // Aplicar formato de fecha personalizado
  if (dateFormat === 'MM/DD/YYYY') {
    // Convertir DD/MM/YYYY a MM/DD/YYYY
    return formatted.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3');
  } else if (dateFormat === 'YYYY-MM-DD') {
    // Convertir DD/MM/YYYY a YYYY-MM-DD
    return formatted.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
  }

  return formatted;
};

export const formatDateOnly = (
  date: Date | string,
  timezone = 'America/Argentina/Buenos_Aires',
  dateFormat = 'DD/MM/YYYY'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  const formatter = new Intl.DateTimeFormat('es-AR', options);
  const formatted = formatter.format(dateObj);

  // Aplicar formato de fecha personalizado
  if (dateFormat === 'MM/DD/YYYY') {
    return formatted.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3');
  } else if (dateFormat === 'YYYY-MM-DD') {
    return formatted.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
  }

  return formatted;
};

export const formatTimeOnly = (
  date: Date | string,
  timezone = 'America/Argentina/Buenos_Aires',
  timeFormat: '12h' | '24h' = '24h'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h'
  };

  const formatter = new Intl.DateTimeFormat('es-AR', options);
  return formatter.format(dateObj);
};

export const getCurrentDateTime = (timezone = 'America/Argentina/Buenos_Aires'): Date => {
  return new Date();
};

export const timezoneOffsetHours = (timezone: string): string => {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  const offset = (target.getTime() - utc.getTime()) / (1000 * 60 * 60);
  return offset >= 0 ? `+${offset}` : `${offset}`;
};