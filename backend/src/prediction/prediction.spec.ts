import { auc, binByProbability, logLoss } from './evaluation';
import { gradeOf, gradeRange } from '../domain/grades';
import { fitClosingModel } from './closing-model';
import { predict, train } from './logistic-regression';
import { makeClient } from '../../test/fixtures';

describe('logistic regression', () => {
  it('aprende que una variable sube la probabilidad', () => {
    // x=1 cierra 90% de las veces; x=0, 30%.
    const X: number[][] = [];
    const y: number[] = [];
    for (let i = 0; i < 100; i++) {
      X.push([1]);
      y.push(i < 90 ? 1 : 0);
      X.push([0]);
      y.push(i < 30 ? 1 : 0);
    }
    const model = train(X, y, { l2: 0.01, maxIterations: 50 });

    expect(predict(model, [1])).toBeCloseTo(0.9, 1);
    expect(predict(model, [0])).toBeCloseTo(0.3, 1);
    expect(model.weights[0]).toBeGreaterThan(0);
  });

  it('la regularización encoge pesos de variables raras', () => {
    const X = [[1], [0], [0], [0]];
    const y = [1, 0, 1, 0];
    const weak = train(X, y, { l2: 0.01, maxIterations: 50 });
    const strong = train(X, y, { l2: 10, maxIterations: 50 });
    expect(Math.abs(strong.weights[0])).toBeLessThan(Math.abs(weak.weights[0]));
  });
});

describe('auc', () => {
  it('es 1 si ordena perfecto, 0,5 si no distingue', () => {
    expect(auc([0.9, 0.8, 0.2, 0.1], [1, 1, 0, 0])).toBe(1);
    expect(auc([0.5, 0.5, 0.5, 0.5], [1, 0, 1, 0])).toBe(0.5);
  });
});

describe('logLoss', () => {
  it('castiga más las predicciones seguras y equivocadas', () => {
    expect(logLoss([0.9], [0])).toBeGreaterThan(logLoss([0.6], [0]));
  });
});

describe('binByProbability', () => {
  it('cuenta cerrados y no cerrados por rango', () => {
    const bins = binByProbability([0.05, 0.12, 0.18, 0.95], [0, 1, 0, 1], 0.1);
    expect(bins).toHaveLength(10);
    expect(bins[1]).toMatchObject({ closed: 1, open: 1 });
    expect(bins[1].meanPredicted).toBeCloseTo(0.15);
    expect(bins[9]).toMatchObject({ closed: 1, open: 0 });
  });
});

describe('grades', () => {
  it('asigna la nota según la probabilidad', () => {
    expect(gradeOf(0.9)).toBe('A');
    expect(gradeOf(0.85)).toBe('A');
    expect(gradeOf(0.82)).toBe('B');
    expect(gradeOf(0.77)).toBe('C');
    expect(gradeOf(0.72)).toBe('D');
    expect(gradeOf(0.65)).toBe('E');
    expect(gradeOf(0.64)).toBe('F');
    expect(gradeOf(0.4)).toBe('F');
  });

  it('describe el rango de cada nota', () => {
    expect(gradeRange('A')).toBe('≥ 85%');
    expect(gradeRange('E')).toBe('65%–70%');
    expect(gradeRange('F')).toBe('< 65%');
  });
});

describe('fitClosingModel', () => {
  // Toro cierra 90% en Salud; Puma, 30%. El resto de las variables es igual.
  const clients = Array.from({ length: 200 }, (_, i) =>
    makeClient({
      seller: i % 2 ? 'Toro' : 'Puma',
      closed: i % 2 ? i % 20 !== 1 : i % 10 < 3,
      categories: { industry: 'salud' },
    }),
  );
  const model = fitClosingModel(clients);

  it('elige la regularización por validación cruzada', () => {
    expect([3, 10, 30, 100]).toContain(model.l2);
    expect(model.sellers).toEqual(['Puma', 'Toro']);
  });

  it('simula la probabilidad con otro vendedor', () => {
    const lead = clients[0]; // atendido por Puma
    expect(model.probabilityWith(lead, 'Toro')).toBeGreaterThan(
      model.probabilityWith(lead, 'Puma'),
    );
  });
});
