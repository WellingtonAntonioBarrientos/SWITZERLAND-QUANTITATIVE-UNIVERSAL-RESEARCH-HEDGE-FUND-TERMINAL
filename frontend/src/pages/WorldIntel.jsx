import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Globe, XCircle } from "lucide-react";
import GlobeGL from 'react-globe.gl';
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

const WorldIntel = ({ viewMode }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const globeRef = useCallback(node => {
    if (node !== null) {
      // Auto-rotate the globe
      node.controls().autoRotate = true;
      node.controls().autoRotateSpeed = 0.5;
      node.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API}/intel/events`);
        setEvents(res.data);
      } catch (e) {
        logError("Error fetching intel events:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 180000); // Auto-refresh every 3 minutes
    return () => clearInterval(interval);
  }, []);

  // Focus globe on selected event
  useEffect(() => {
    if (selectedEvent && globeRef.current) {
      globeRef.current.pointOfView({
        lat: selectedEvent.lat,
        lng: selectedEvent.lng,
        altitude: 1.5
      }, 1000);
    }
  }, [selectedEvent, globeRef]);

  const isNautical = viewMode === 'nautical';
  const isWellington = viewMode === 'wellington';

  // Globe colors based on view mode
  const globeColors = {
    modern: { globe: '#0a0a0a', land: '#1a1a2e', border: '#3b82f6', glow: '#3b82f6' },
    wellington: { globe: '#000000', land: '#1a1a00', border: '#ff6600', glow: '#ff6600' },
    nautical: { globe: '#0c1222', land: '#1e3a5f', border: '#0ea5e9', glow: '#22d3ee' }
  };
  const colors = globeColors[viewMode] || globeColors.modern;

  // Event marker colors by severity
  const getMarkerColor = (severity) => {
    if (severity === 'HIGH') return '#ef4444';
    if (severity === 'MEDIUM') return '#f59e0b';
    return isNautical ? '#22d3ee' : '#3b82f6';
  };

  // Convert events to globe points format
  const pointsData = events.map(event => ({
    ...event,
    lat: event.lat,
    lng: event.lng,
    size: event.severity === 'HIGH' ? 0.8 : event.severity === 'MEDIUM' ? 0.6 : 0.4,
    color: getMarkerColor(event.severity)
  }));

  // Ring data for pulsing effect on selected event
  const ringsData = selectedEvent ? [{
    lat: selectedEvent.lat,
    lng: selectedEvent.lng,
    maxR: 5,
    propagationSpeed: 2,
    repeatPeriod: 1000,
    color: getMarkerColor(selectedEvent.severity)
  }] : [];

  // Arc data to show connections between events
  const arcsData = events.length > 1 ? events.slice(0, -1).map((event, i) => ({
    startLat: event.lat,
    startLng: event.lng,
    endLat: events[i + 1].lat,
    endLng: events[i + 1].lng,
    color: isNautical ? ['#22d3ee', '#0ea5e9'] : ['#3b82f6', '#00e676']
  })) : [];

  if (loading) return <LoadingState />;

  return (
    <div data-testid="world-intel">
      <div className="page-header">
        <div>
          <h1 className="page-title">WORLD INTEL MAP</h1>
          <p className="page-subtitle">Global market intelligence & events • 3D Interactive Globe</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-[#71717a]">High</span>
            <div className="w-2 h-2 rounded-full bg-[#f59e0b] ml-2" />
            <span className="text-[#71717a]">Medium</span>
            <div className={`w-2 h-2 rounded-full ${isNautical ? 'bg-[#22d3ee]' : 'bg-[#3b82f6]'} ml-2`} />
            <span className="text-[#71717a]">Low</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* 3D Globe */}
        <div className="col-span-8">
          <div 
            className={`quant-card overflow-hidden ${isNautical ? 'border-[#1e3a5f]' : ''}`} 
            style={{ height: '600px' }}
            data-testid="intel-globe"
          >
            <div className="quant-card-header flex justify-between items-center">
              <span>INTERACTIVE GLOBE</span>
              <span className="text-[10px] text-[#71717a]">{events.length} Active Events</span>
            </div>
            <div style={{ height: 'calc(100% - 40px)', background: colors.globe }}>
              <GlobeGL
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                
                pointsData={pointsData}
                pointAltitude={d => d.size * 0.1}
                pointRadius={d => d.size * 0.5}
                pointColor={d => d.color}
                pointLabel={d => `
                  <div style="background: #0a0a0a; border: 1px solid #27272a; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 11px;">
                    <div style="color: ${d.color}; font-weight: bold; margin-bottom: 4px;">${d.title}</div>
                    <div style="color: #71717a;">${d.region} • ${d.event_type}</div>
                  </div>
                `}
                onPointClick={(point) => setSelectedEvent(point)}
                
                ringsData={ringsData}
                ringColor={() => colors.glow}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}
                
                atmosphereColor={colors.glow}
                atmosphereAltitude={0.15}
                
                width={window.innerWidth * 0.55}
                height={560}
              />
            </div>
          </div>
        </div>

        {/* Event Details & List */}
        <div className="col-span-4 space-y-4">
          {/* Selected Event Card */}
          {selectedEvent && (
            <div className={`quant-card ${isNautical ? 'border-[#1e3a5f]' : ''}`} data-testid="selected-event">
              <div className="quant-card-header flex justify-between items-center">
                <span>EVENT DETAILS</span>
                <button onClick={() => setSelectedEvent(null)} className="text-[#71717a] hover:text-white">
                  <XCircle size={14} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    selectedEvent.severity === 'HIGH' ? 'badge-rejected' : 
                    selectedEvent.severity === 'MEDIUM' ? 'badge-pending' : 'badge-processing'
                  }`}>
                    {selectedEvent.severity}
                  </span>
                  <span className="text-xs text-[#71717a]">{selectedEvent.event_type}</span>
                </div>
                <h3 className="font-semibold text-[#ededed]">{selectedEvent.title}</h3>
                <p className="text-sm text-[#a1a1aa]">{selectedEvent.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272a]">
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a]">Coordinates</div>
                    <div className="font-mono text-xs">
                      {selectedEvent.lat.toFixed(4)}°, {selectedEvent.lng.toFixed(4)}°
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#71717a]">Region</div>
                    <div className="font-mono text-xs">{selectedEvent.region}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Stats */}
          <div className={`quant-card ${isNautical ? 'border-[#1e3a5f]' : ''}`}>
            <div className="quant-card-header">EVENT STATISTICS</div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="font-mono text-xl font-semibold text-[#ef4444]">
                  {events.filter(e => e.severity === 'HIGH').length}
                </div>
                <div className="text-[10px] text-[#71717a] uppercase">High</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-xl font-semibold text-[#f59e0b]">
                  {events.filter(e => e.severity === 'MEDIUM').length}
                </div>
                <div className="text-[10px] text-[#71717a] uppercase">Medium</div>
              </div>
              <div className="text-center">
                <div className={`font-mono text-xl font-semibold ${isNautical ? 'text-[#22d3ee]' : 'text-[#3b82f6]'}`}>
                  {events.filter(e => e.severity === 'LOW').length}
                </div>
                <div className="text-[10px] text-[#71717a] uppercase">Low</div>
              </div>
            </div>
          </div>

          {/* Recent Events List */}
          <div className={`quant-card ${isNautical ? 'border-[#1e3a5f]' : ''}`}>
            <div className="quant-card-header">RECENT EVENTS</div>
            <div className="max-h-[300px] overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 border-b border-[#27272a]/50 cursor-pointer hover:bg-[#3b82f6]/5 transition-colors ${
                    selectedEvent?.id === event.id ? (isNautical ? 'bg-[#0ea5e9]/10 border-l-2 border-l-[#0ea5e9]' : 'bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]') : ''
                  }`}
                  data-testid={`event-${event.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'HIGH' ? 'bg-[#ef4444]' : 
                      event.severity === 'MEDIUM' ? 'bg-[#f59e0b]' : 
                      isNautical ? 'bg-[#22d3ee]' : 'bg-[#3b82f6]'
                    }`} />
                    <span className="font-mono text-[10px] text-[#71717a]">{event.event_type}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#71717a]">
                      {event.lat.toFixed(1)}°, {event.lng.toFixed(1)}°
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-[#71717a] mt-1">{event.region}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldIntel;
