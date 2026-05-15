import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSettings } from './providers/SettingsProvider';
import { AppRouting } from './routing';
import { PathnameProvider } from './providers';
import { installGlobalFormUppercase } from './utils/formUppercase';
import { LyraAssistant } from './components/lyra';

const { BASE_URL } = import.meta.env;

const App = () => {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add(settings.themeMode);
  }, [settings]);

  /** Texto en formularios en MAYÚSCULAS (valor + visual). */
  useEffect(() => {
    return installGlobalFormUppercase(document);
  }, []);

  return (
    <BrowserRouter basename={BASE_URL}>
      <PathnameProvider>
        <AppRouting />
        <LyraAssistant />
      </PathnameProvider>
    </BrowserRouter>
  );
};

export { App };
