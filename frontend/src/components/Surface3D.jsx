import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

// Common layout settings for dark theme
const darkLayout = {
  paper_bgcolor: '#0a0a0a',
  plot_bgcolor: '#0a0a0a',
  font: { color: '#71717a', family: 'JetBrains Mono, monospace', size: 10 },
  margin: { l: 40, r: 40, t: 40, b: 40 },
  scene: {
    xaxis: { 
      gridcolor: '#27272a', 
      zerolinecolor: '#3b82f6',
      showbackground: true,
      backgroundcolor: '#050505'
    },
    yaxis: { 
      gridcolor: '#27272a', 
      zerolinecolor: '#3b82f6',
      showbackground: true,
      backgroundcolor: '#050505'
    },
    zaxis: { 
      gridcolor: '#27272a', 
      zerolinecolor: '#3b82f6',
      showbackground: true,
      backgroundcolor: '#050505'
    },
    bgcolor: '#050505'
  }
};

// Price History 3D Surface
export const PriceHistory3D = ({ chartData, height = 400 }) => {
  const { x, y, z, colors } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { x: [[0]], y: [[0]], z: [[0]], colors: [[0]] };
    }
    
    const prices = chartData.map(d => Number(d.close || d.price) || 100);
    const cols = Math.min(prices.length, 50);
    const rows = 10;
    
    const xData = [];
    const yData = [];
    const zData = [];
    const colorData = [];
    
    for (let i = 0; i < rows; i++) {
      const xRow = [];
      const yRow = [];
      const zRow = [];
      const colorRow = [];
      
      for (let j = 0; j < cols; j++) {
        const priceIdx = Math.floor(j * (prices.length / cols));
        const basePrice = prices[priceIdx] || 100;
        const variation = Math.sin(i / rows * Math.PI) * 0.05;
        const value = basePrice * (1 + variation);
        
        xRow.push(j);
        yRow.push(i);
        zRow.push(value);
        colorRow.push(value);
      }
      
      xData.push(xRow);
      yData.push(yRow);
      zData.push(zRow);
      colorData.push(colorRow);
    }
    
    return { x: xData, y: yData, z: zData, colors: colorData };
  }, [chartData]);
  
  return (
    <div style={{ height, background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #27272a', 
        fontSize: '10px', 
        textTransform: 'uppercase',
        color: '#71717a',
        letterSpacing: '0.05em'
      }}>
        Price Terrain • 3D Surface • Drag to rotate
      </div>
      <Plot
        data={[{
          type: 'surface',
          x: x[0],
          y: y.map((_, i) => i),
          z: z,
          colorscale: [
            [0, '#0c4a6e'],
            [0.25, '#0369a1'],
            [0.5, '#0ea5e9'],
            [0.75, '#38bdf8'],
            [1, '#7dd3fc']
          ],
          showscale: false,
          contours: {
            z: { show: true, usecolormap: true, highlightcolor: "#22d3ee", project: { z: true } }
          }
        }]}
        layout={{
          ...darkLayout,
          height: height - 40,
          scene: {
            ...darkLayout.scene,
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
            xaxis: { ...darkLayout.scene.xaxis, title: 'Time' },
            yaxis: { ...darkLayout.scene.yaxis, title: '' },
            zaxis: { ...darkLayout.scene.zaxis, title: 'Price' }
          }
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// Correlation Matrix 3D Surface
export const CorrelationMatrix3D = ({ matrix, assets, height = 400 }) => {
  const { z, labels } = useMemo(() => {
    if (!matrix || !assets || assets.length === 0) {
      return { z: [[0]], labels: [''] };
    }
    
    const zData = assets.map(asset => 
      assets.map(other => Number(matrix[asset]?.[other]) || 0)
    );
    
    return { z: zData, labels: assets };
  }, [matrix, assets]);
  
  return (
    <div style={{ height, background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #27272a', 
        fontSize: '10px', 
        textTransform: 'uppercase',
        color: '#71717a',
        letterSpacing: '0.05em',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Correlation Matrix • 3D Surface</span>
        <span>{assets?.length}x{assets?.length} • Drag to rotate</span>
      </div>
      <Plot
        data={[{
          type: 'surface',
          z: z,
          x: labels,
          y: labels,
          colorscale: [
            [0, '#ef4444'],
            [0.5, '#27272a'],
            [1, '#00e676']
          ],
          showscale: true,
          colorbar: {
            tickfont: { color: '#71717a', size: 10 },
            title: { text: 'Correlation', font: { color: '#71717a', size: 10 } }
          }
        }]}
        layout={{
          ...darkLayout,
          height: height - 40,
          scene: {
            ...darkLayout.scene,
            camera: { eye: { x: 1.8, y: 1.8, z: 1.2 } },
            xaxis: { ...darkLayout.scene.xaxis, title: '', tickvals: labels, ticktext: labels },
            yaxis: { ...darkLayout.scene.yaxis, title: '', tickvals: labels, ticktext: labels },
            zaxis: { ...darkLayout.scene.zaxis, title: 'ρ', range: [-1, 1] }
          }
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// Market Indices 3D Bars
export const MarketIndices3D = ({ indices, height = 400 }) => {
  const { symbols, values, colors } = useMemo(() => {
    if (!indices || indices.length === 0) {
      return { symbols: [''], values: [0], colors: ['#3b82f6'] };
    }
    
    return {
      symbols: indices.map(idx => idx.symbol || ''),
      values: indices.map(idx => Number(idx.change_percent) || 0),
      colors: indices.map(idx => (Number(idx.change_percent) || 0) >= 0 ? '#00e676' : '#ef4444')
    };
  }, [indices]);
  
  return (
    <div style={{ height, background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #27272a', 
        fontSize: '10px', 
        textTransform: 'uppercase',
        color: '#71717a',
        letterSpacing: '0.05em'
      }}>
        Market Performance • 3D Bars • Drag to rotate
      </div>
      <Plot
        data={[{
          type: 'bar',
          x: symbols,
          y: values,
          marker: {
            color: colors,
            line: { color: colors.map(c => c === '#00e676' ? '#00c853' : '#d32f2f'), width: 1 }
          },
          text: values.map(v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`),
          textposition: 'outside',
          textfont: { color: '#71717a', size: 9 }
        }]}
        layout={{
          ...darkLayout,
          height: height - 40,
          xaxis: { 
            gridcolor: '#27272a',
            tickfont: { color: '#71717a', size: 9 },
            tickangle: -45
          },
          yaxis: { 
            gridcolor: '#27272a',
            tickfont: { color: '#71717a', size: 9 },
            title: { text: '% Change', font: { color: '#71717a', size: 10 } },
            zeroline: true,
            zerolinecolor: '#3b82f6',
            zerolinewidth: 2
          },
          bargap: 0.3
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// Generic Surface3D Chart
export const Surface3DChart = ({ 
  data, 
  type = 'surface',
  colorScale = 'default',
  height = 400,
  title = ''
}) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [[0]];
    if (Array.isArray(data[0])) return data;
    // Convert 1D to 2D grid
    const size = Math.ceil(Math.sqrt(data.length));
    const grid = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(Number(data[i * size + j]) || 0);
      }
      grid.push(row);
    }
    return grid;
  }, [data]);

  const colorscaleMap = {
    'default': [[0, '#3b82f6'], [0.5, '#8b5cf6'], [1, '#ec4899']],
    'profit-loss': [[0, '#ef4444'], [0.5, '#27272a'], [1, '#00e676']],
    'heat': [[0, '#3b82f6'], [0.5, '#f59e0b'], [1, '#ef4444']],
    'ocean': [[0, '#0c4a6e'], [0.5, '#0ea5e9'], [1, '#7dd3fc']]
  };

  return (
    <div style={{ height, background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden' }}>
      {title && (
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid #27272a', 
          fontSize: '10px', 
          textTransform: 'uppercase',
          color: '#71717a',
          letterSpacing: '0.05em'
        }}>
          {title} • 3D View
        </div>
      )}
      <Plot
        data={[{
          type: 'surface',
          z: processedData,
          colorscale: colorscaleMap[colorScale] || colorscaleMap.default,
          showscale: false
        }]}
        layout={{
          ...darkLayout,
          height: title ? height - 40 : height,
          scene: {
            ...darkLayout.scene,
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
          }
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default Surface3DChart;
