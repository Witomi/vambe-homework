import { Logger } from '@nestjs/common';
import { LlmProvider, LlmRateLimitError } from './llm-provider';
import { RateLimitedLlmProvider } from './rate-limited.provider';

const RPM_WITHOUT_WAIT = 60_000;

describe('RateLimitedLlmProvider', () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  it('delega en el proveedor interno', async () => {
    const inner: LlmProvider = {
      model: 'm',
      generate: jest.fn().mockResolvedValue({ text: 'ok', model: 'm' }),
    };
    const provider = new RateLimitedLlmProvider(inner, RPM_WITHOUT_WAIT);

    await expect(provider.generate('hola')).resolves.toEqual({
      text: 'ok',
      model: 'm',
    });
    expect(provider.model).toBe('m');
  });

  it('espera y reintenta cuando el proveedor responde 429', async () => {
    const generate = jest
      .fn()
      .mockRejectedValueOnce(new LlmRateLimitError('429', 1))
      .mockResolvedValue({ text: 'ok', model: 'm' });
    const provider = new RateLimitedLlmProvider(
      { model: 'm', generate },
      RPM_WITHOUT_WAIT,
    );

    await provider.generate('hola');

    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('propaga errores que no son de cuota', async () => {
    const provider = new RateLimitedLlmProvider(
      { model: 'm', generate: () => Promise.reject(new Error('boom')) },
      RPM_WITHOUT_WAIT,
    );

    await expect(provider.generate('hola')).rejects.toThrow('boom');
  });
});
