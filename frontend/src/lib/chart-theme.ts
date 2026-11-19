/**
 * Colores y estilos de los gráficos (Recharts dibuja SVG y necesita
 * valores concretos, no clases). Son los mismos tokens de `globals.css`:
 * azul = cerró / sobre el promedio, rojo = no cerró / bajo el promedio.
 */
export const CHART = {
  series: {
    primary: '#2a78d6',
    primaryLight: '#b7d3f6',
    negative: '#e34948',
    neutral: '#8a8984',
  },
  /** Separación entre barras apiladas: el color de la superficie. */
  surface: '#ffffff',
  grid: '#ecebe7',
  text: '#52514e',
  axisTick: { fontSize: 11, fill: '#52514e' },
} as const;

/** Etiquetas de leyenda con el color de texto, no el de la serie. */
export const legendLabelStyle = { color: CHART.text };
