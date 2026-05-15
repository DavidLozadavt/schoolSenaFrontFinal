import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody } from '@/components/modal';
import { searchCities } from '@/services/geocodingService';
import { lyraSetCity, onLyraSetCity } from '@/utils/lyraMapBridge';

const POPULAR_CITIES = [
  { name: 'Popayán', value: 'Popayán, Cauca, Colombia' },
  { name: 'Bogotá', value: 'Bogotá, Colombia' },
  { name: 'Cali', value: 'Cali, Valle del Cauca, Colombia' },
  { name: 'Medellín', value: 'Medellín, Antioquia, Colombia' },
];

const CitySelectorModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const savedCity = sessionStorage.getItem('home_locationTerm');
    if (!savedCity) {
      setIsOpen(true);
    }

    // Listen for external city sets (e.g. GPS from LyraAssistant)
    return onLyraSetCity((city) => {
      if (city) setIsOpen(false);
    });
  }, []);

  useEffect(() => {
    if (searchTerm.length < 1) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchCities(searchTerm);
        
        // Filtrar solo por ciudades, pueblos o divisiones administrativas
        const filtered = (results || []).filter((item: any) => {
          const type = (item.addresstype || item.type || '').toLowerCase();
          const category = (item.class || '').toLowerCase();
          
          return [
            'city', 'town', 'village', 'municipality', 
            'state', 'region', 'administrative', 'province',
            'department', 'district', 'county', 'suburb',
            'neighbourhood', 'locality', 'hamlet', 'croft',
            'isolated_dwelling', 'administrative_area_level_1',
            'administrative_area_level_2', 'political'
          ].includes(type) || category === 'place' || category === 'boundary';
        });

        setSuggestions(filtered.slice(0, 5));
      } catch (error) {
        console.error('Error searching cities:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleSelectCity = (city: string) => {
    sessionStorage.setItem('home_locationTerm', city);
    lyraSetCity(city);
    setIsOpen(false);
    window.dispatchEvent(new Event('storage')); 
  };

  const useGPSLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const { reverseGeocode } = await import('@/services/geocodingService');
          const cityName = await reverseGeocode(latitude, longitude);
          if (cityName) {
            handleSelectCity(cityName);
          }
        } catch (error) {
          console.error('Error in reverse geocoding:', error);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('GPS Error:', err);
        setIsLocating(false);
      }
    );
  };

  return (
    <Modal 
      open={isOpen} 
      zIndex={999999}
      onClose={() => {
        // No permitir cerrar si no hay ciudad
        if (sessionStorage.getItem('home_locationTerm')) {
          setIsOpen(false);
        }
      }}
      className="flex items-center justify-center p-4 !overflow-visible"
    >
      <ModalContent className="w-[90%] sm:w-full sm:max-w-[420px] bg-[#0a0a0b]/85 backdrop-blur-[40px] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.15)] !overflow-visible border border-white/10 p-1 transition-all duration-700 animate-in fade-in zoom-in-90">
        <ModalBody className="p-6 sm:p-9 pb-12 sm:pb-16 !overflow-visible relative overflow-hidden rounded-[2.8rem]">
          {/* Enhanced Aurora Layers */}
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-violet-600/25 rounded-full blur-[110px] animate-pulse pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-fuchsia-600/20 rounded-full blur-[110px] animate-pulse pointer-events-none delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col items-center mb-8 relative z-10 text-center">
            <div className="relative mb-6 group">
              {/* Luxury Ring Glow */}
              <div className="absolute -inset-6 bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              
              <div className="relative w-18 h-18 sm:w-22 sm:h-22 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-3xl flex items-center justify-center transform group-hover:scale-105 group-hover:-rotate-3 transition-all duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-transparent to-fuchsia-500/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"></div>
                <i className="fa-solid fa-map-location-dot text-4xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"></i>
              </div>
              
              <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-fuchsia-600 to-violet-600 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-[#09090a]">
                <i className="fa-solid fa-sparkles text-white text-[10px] sm:text-xs"></i>
              </div>
            </div>
            
            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
              Nexi<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">Service</span>
            </h2>
            <div className="flex items-center gap-2 px-4 py-1 bg-white/5 rounded-full border border-white/5">
              <i className="fa-solid fa-shield-check text-green-400 text-[8px]"></i>
              <p className="text-white/50 font-bold text-[9px] uppercase tracking-[0.3em]">
                Selección de Ubicación Segura
              </p>
            </div>
          </div>

          <button
            onClick={useGPSLocation}
            disabled={isLocating}
            className="w-full relative group mb-8 overflow-hidden rounded-[1.8rem] p-0.5 transition-all duration-500 active:scale-95 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/40 via-fuchsia-500/60 to-violet-600/40 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-[#0d0d0f]/60 backdrop-blur-xl rounded-[1.7rem] py-4.5 px-6 flex items-center justify-between border border-white/10 group-hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl ${isLocating ? 'bg-violet-600 shadow-glow' : 'bg-white/5'} flex items-center justify-center text-white transition-all scale-100 group-hover:scale-110`}>
                  <i className={`fa-solid ${isLocating ? 'fa-spinner fa-spin' : 'fa-satellite-dish'} text-lg`}></i>
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[12px] sm:text-[14px] font-black text-white uppercase tracking-wider mb-0.5">
                    Ubicación Actual
                  </span>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <i className="fa-solid fa-microchip text-[8px]"></i>
                    <span className="text-[9px] text-white font-bold uppercase tracking-widest">
                      Detección Inteligente
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest hidden sm:block">GPS</span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-violet-600 group-hover:border-violet-500 transition-all">
                  <i className="fa-solid fa-arrow-right text-[10px] text-white"></i>
                </div>
              </div>
            </div>
          </button>

          <div className="relative flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="flex items-center gap-2 opacity-30">
              <i className="fa-solid fa-fire-flame-curved text-[10px]"></i>
              <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Destinos Populares</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-10">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => handleSelectCity(city.value)}
                className="group relative h-12 overflow-hidden rounded-[1.2rem] bg-white/5 border border-white/5 hover:border-violet-500/40 hover:bg-white/10 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 to-transparent opacity-0 group-hover:opacity-100"></div>
                <div className="relative h-full flex items-center px-5 gap-3">
                  <i className="fa-solid fa-city text-[10px] text-violet-400 group-hover:scale-125 transition-transform"></i>
                  <span className="text-[11px] font-black text-white/60 group-hover:text-white uppercase tracking-widest truncate">
                    {city.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="relative group z-30">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-[1.8rem] blur opacity-0 group-focus-within:opacity-100 transition duration-700"></div>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 text-white/20 group-focus-within:text-violet-400 transition-all">
                <i className="fa-solid fa-magnifying-glass"></i>
                <div className="w-px h-4 bg-white/10"></div>
              </div>
              <input
                type="text"
                placeholder="Busca tu ciudad o municipio..."
                className="w-full pl-16 pr-12 py-5 rounded-[1.6rem] bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-0 focus:outline-none text-white text-sm font-bold placeholder:text-white/20 transition-all duration-500 shadow-3xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isLoading && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <i className="fa-solid fa-loader fa-spin text-violet-500 text-lg"></i>
                </div>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-[#0a0a0b]/95 backdrop-blur-[50px] rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.9)] border border-white/10 max-h-64 overflow-y-auto z-[9999999] animate-in fade-in slide-in-from-top-4 duration-500 scrollbar-none p-2">
                {suggestions.map((suggestion, idx) => {
                  const parts = suggestion.display_name.split(',');
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectCity(suggestion.display_name)}
                      className="w-full p-4.5 text-left hover:bg-white/5 rounded-[1.5rem] transition-all flex items-center gap-4 group/item mb-1 last:mb-0 border border-transparent hover:border-white/5"
                    >
                      <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-tr from-violet-600/10 to-violet-600/30 flex items-center justify-center text-violet-400 group-hover/item:from-violet-600 group-hover/item:text-white transition-all shadow-inner">
                        <i className="fa-solid fa-map-pin text-[15px]"></i>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-black text-white group-hover/item:text-violet-300 uppercase tracking-wider truncate">
                            {parts[0]}
                          </span>
                          <span className="px-1.5 py-0.5 bg-violet-600/20 rounded text-[7px] text-violet-400 font-black uppercase tracking-widest border border-violet-500/10">OK</span>
                        </div>
                        {parts.length > 1 && (
                          <span className="text-[9px] font-bold text-white/20 group-hover/item:text-white/40 truncate uppercase tracking-[0.1em]">
                            {parts.slice(1, 3).join(' • ')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {searchTerm.length >= 1 && !isLoading && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-[#0a0a0b]/95 backdrop-blur-3xl rounded-[2.2rem] p-9 shadow-[0_40px_80px_rgba(0,0,0,0.9)] border border-white/10 z-[9999999] animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-[1.8rem] flex items-center justify-center text-fuchsia-500 mb-5 border border-white/5 animate-pulse">
                    <i className="fa-solid fa-compass-slash text-2xl"></i>
                  </div>
                  <h4 className="text-white font-black text-[13px] uppercase tracking-widest mb-2">
                    Ubicación no encontrada
                  </h4>
                  <p className="text-[11px] font-medium text-white/25 leading-relaxed max-w-[220px]">
                    No pudimos localizar ese lugar. Prueba buscando tu departamento o ciudad principal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CitySelectorModal;
