// Live ECharts slides. Charts are created the first time their slide is shown,
// because remark keeps hidden slides at zero size.
const ink = '#180e30', mutedInk = '#514961', grid = '#e1dce9', canvasColor = '#f7f6fb';
const warm = '#e0662f';
const platformColors = { Intel: '#5271cb', AMD: '#c05c2f', 'Apple Silicon': '#0e8a6c', Qualcomm: '#764edd', Other: '#737582' };
const formColors = { Desktop: '#5271cb', Laptop: '#c05c2f', Phone: '#0e8a6c', Tablet: '#764edd' };
const formSymbols = { Desktop: 'rect', Laptop: 'circle', Phone: 'triangle', Tablet: 'diamond' };
const baseText = { fontFamily: 'Inter', color: ink };
const tooltipStyle = { confine: true, textStyle: { fontSize: 14, fontFamily: 'Inter' } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function median(values) {
  const v = [...values].sort((a, b) => a - b), m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

// Yearly laptop CPU median, half-median, and Apple Silicon performance trend.
const laptopMedians = [];
for (let year = 2012; year <= 2026; year++) {
  laptopMedians.push([year + 0.5, median(laptopRows.filter(r => Math.floor(r[0]) === year).map(r => r[1]))]);
}
const appleSiliconTrend = deviceRows.filter(r => r[1] === 'Laptop' && r[2] === 'Apple Silicon' && /^Apple M\d/.test(r[4]))
  .map(r => [r[0], r[7]]).sort((a, b) => a[0] - b[0]);

function laptopOption(halved, apple) {
  return {
    animationDuration: 900,
    animationDurationUpdate: 900,
    backgroundColor: canvasColor,
    textStyle: baseText,
    legend: { top: 0, right: 10, textStyle: { fontSize: 15, color: mutedInk },
              data: ['Yearly median', ...(halved ? ['Median ÷ 2'] : []), ...(apple ? ['Apple Silicon'] : [])] },
    grid: { left: 80, right: 30, top: 50, bottom: 55 },
    tooltip: { ...tooltipStyle, formatter: p => `<b>${Math.round(p.value[1]).toLocaleString()}</b> ${esc(p.seriesName)}, ${Math.floor(p.value[0])}` },
    xAxis: { type: 'value', min: 2012, max: 2027, interval: 2, axisLabel: { fontSize: 15, formatter: v => v < 2027 ? String(v) : '' },
             splitLine: { show: false }, axisLine: { lineStyle: { color: '#8d849e' } } },
    yAxis: { type: 'value', min: 0, max: 6000, name: 'PassMark single-thread score', nameLocation: 'middle', nameGap: 58,
             nameTextStyle: { fontSize: 15, color: mutedInk }, axisLabel: { fontSize: 15, formatter: v => v ? v / 1000 + 'K' : '0' },
             splitLine: { lineStyle: { color: grid } } },
    series: [
      { name: 'Yearly median', type: 'line', z: 4, symbolSize: 8, lineStyle: { width: 3, color: ink }, itemStyle: { color: ink },
        data: laptopMedians,
        endLabel: { show: true, fontSize: 15, color: ink, formatter: p => Math.round(p.value[1]).toLocaleString() } },
      ...(halved ? [{
        name: 'Median ÷ 2', type: 'line', z: 5, symbolSize: 8, lineStyle: { width: 3, color: warm }, itemStyle: { color: warm },
        data: laptopMedians.map(([x, y]) => [x, y / 2]),
        endLabel: { show: true, fontSize: 15, color: ink, formatter: p => Math.round(p.value[1]).toLocaleString() },
      }] : []),
      ...(apple ? [{ name: 'Apple Silicon', type: 'line', z: 6, symbolSize: 8, lineStyle: { width: 3, color: '#0e8a6c' }, itemStyle: { color: '#0e8a6c' }, data: appleSiliconTrend }] : []),
    ],
  };
}

// Complete devices: introduction year × launch price × single-thread score.
function devicesOption() {
  const axis = (name, extra) => ({ type: 'value', name, nameGap: 26, nameTextStyle: { fontSize: 15, color: ink },
    axisLabel: { fontSize: 12, color: mutedInk }, axisLine: { lineStyle: { color: '#8d849e' } }, ...extra });
  return {
    backgroundColor: canvasColor,
    textStyle: baseText,
    legend: { top: 0, right: 10, textStyle: { fontSize: 15, color: mutedInk }, data: Object.keys(formColors) },
    tooltip: { ...tooltipStyle, formatter: p => { const r = p.data.row;
      return `<b>${r[7].toLocaleString()}</b> ${esc(r[3])}<br>${esc(r[4])}<br>${r[0]} - $${r[5].toLocaleString()} at launch ($${r[6].toLocaleString()} in 2026 dollars)`; } },
    xAxis3D: axis('Year', { min: 2012, max: 2026, interval: 2, axisLabel: { fontSize: 12, color: mutedInk, formatter: v => String(v) } }),
    yAxis3D: axis('Price (2026 USD, log)', { type: 'log', min: 200, max: 10000, axisLabel: { fontSize: 12, color: mutedInk, formatter: v => '$' + v.toLocaleString() } }),
    zAxis3D: axis('Single-thread', { min: 0, max: 7000 }),
    grid3D: { boxWidth: 150, boxDepth: 100, boxHeight: 85, environment: canvasColor,
              viewControl: { alpha: 18, beta: 30, distance: 200, autoRotate: true, autoRotateSpeed: 6 },
              light: { main: { intensity: 1.1 }, ambient: { intensity: 0.6 } } },
    series: Object.keys(formColors).map(form => ({
      name: form, type: 'scatter3D', symbol: formSymbols[form], symbolSize: 11,
      itemStyle: { color: formColors[form] },
      data: deviceRows.filter(r => r[1] === form).map(r => ({ value: [r[0], r[6], r[7]], row: r,
        itemStyle: { color: formColors[form], opacity: r[8] ? 0.35 : 0.9 } })),
    })),
  };
}

const chartBuilders = {
  laptops(chart) {
    let halved = false, apple = false;
    const draw = () => chart.setOption(laptopOption(halved, apple), true);
    draw();
    return {
      halved: () => { halved = !halved; draw(); },
      apple: () => { apple = !apple; draw(); },
    };
  },
  devices(chart) {
    chart.setOption(devicesOption());
  },
};

function showCharts() {
  for (const node of document.querySelectorAll('.remark-visible [data-chart]')) {
    if (node.chart) { node.chart.resize(); continue; }
    node.chart = echarts.init(node, null, { renderer: node.dataset.chart === 'devices' ? undefined : 'canvas' });
    const steps = chartBuilders[node.dataset.chart](node.chart);
    if (!steps) continue;
    for (const button of node.parentElement.querySelectorAll('.chart-step')) {
      button.addEventListener('click', steps[button.dataset.step]);
    }
  }
}

slideshow.on('afterShowSlide', () => requestAnimationFrame(showCharts));
window.addEventListener('resize', () => document.querySelectorAll('[data-chart]').forEach(n => n.chart && n.chart.resize()));
requestAnimationFrame(showCharts);
