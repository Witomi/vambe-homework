import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde status ok con timestamp ISO', () => {
    const response = new HealthController().check();
    expect(response.status).toBe('ok');
    expect(() => new Date(response.timestamp).toISOString()).not.toThrow();
  });
});
