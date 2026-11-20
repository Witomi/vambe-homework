import { Logger } from '@nestjs/common';
import { CategorizationStore } from '../data/categorization.store';
import { CategorizationRecord, RawClient } from '../domain/client';
import { ClientsRepository } from '../data/clients.repository';
import { baseCategories } from '../../test/fixtures';
import { BatchCategorizer } from './batch-categorizer';
import { CategorizationService } from './categorization.service';
import { LlmProvider } from './llm/llm-provider';

const rawClients: RawClient[] = Array.from({ length: 5 }, (_, i) => ({
  id: `id${i}`,
  name: `Cliente ${i}`,
  email: `c${i}@example.com`,
  phone: '569',
  seller: 'Puma',
  meetingDate: '2024-01-01',
  closed: true,
  transcript: `Transcripción ${i}`,
}));

/** Responde categorizando los `ref` presentes en el prompt. */
function answer(prompt: string, skipRefs: number[] = []): string {
  const input = JSON.parse(prompt.slice(prompt.lastIndexOf('['))) as {
    ref: number;
  }[];
  return JSON.stringify(
    input
      .filter((i) => !skipRefs.includes(i.ref))
      .map((i) => ({ ...baseCategories, ref: i.ref })),
  );
}

function setup(llm: LlmProvider) {
  const saved = new Map<string, CategorizationRecord>();
  const store = {
    has: (id: string) => saved.has(id),
    get size() {
      return saved.size;
    },
    saveMany: (records: Record<string, CategorizationRecord>) => {
      Object.entries(records).forEach(([k, v]) => saved.set(k, v));
      return Promise.resolve();
    },
  } as unknown as CategorizationStore;
  const repository = {
    findRaw: () => rawClients,
  } as unknown as ClientsRepository;
  const categorizer = new BatchCategorizer(llm);
  return {
    saved,
    service: new CategorizationService(categorizer, store, repository),
  };
}

const options = { limit: 5, batchSize: 5, concurrency: 1 };

describe('CategorizationService', () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  it('categoriza en lotes y guarda el modelo que respondió', async () => {
    const generate = jest.fn((prompt: string) =>
      Promise.resolve({ text: answer(prompt), model: 'gemma-test' }),
    );
    const { service, saved } = setup({ model: 'gemma-test', generate });

    const summary = await service.run(options);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({ requested: 5, categorized: 5, failed: 0 });
    expect(saved.get('id0')?.model).toBe('gemma-test');
  });

  it('reintenta individualmente las transcripciones que faltan en la respuesta', async () => {
    let call = 0;
    const generate = jest.fn((prompt: string) => {
      call++;
      // La primera respuesta omite dos elementos del lote.
      const text = call === 1 ? answer(prompt, [2, 4]) : answer(prompt);
      return Promise.resolve({ text, model: 'm' });
    });
    const { service, saved } = setup({ model: 'm', generate });

    const summary = await service.run(options);

    expect(generate).toHaveBeenCalledTimes(3); // 1 lote + 2 reintentos
    expect(summary.categorized).toBe(5);
    expect(saved.size).toBe(5);
  });

  it('marca como fallidas las que siguen fallando tras los reintentos', async () => {
    const generate = jest.fn(() =>
      Promise.resolve({ text: 'no es json', model: 'm' }),
    );
    const { service } = setup({ model: 'm', generate });

    const summary = await service.run({ ...options, limit: 2 });

    expect(summary).toMatchObject({ categorized: 0, failed: 2 });
  });

  it('no vuelve a procesar clientes ya categorizados', async () => {
    const generate = jest.fn((prompt: string) =>
      Promise.resolve({ text: answer(prompt), model: 'm' }),
    );
    const { service } = setup({ model: 'm', generate });

    await service.run(options);
    const second = await service.run(options);

    expect(second.requested).toBe(0);
  });

  it('recategoriza clientes específicos aunque ya estén categorizados', async () => {
    let call = 0;
    const generate = jest.fn((prompt: string) => {
      call++;
      // La corrida inicial responde con "v1"; la recategorización, con "v2".
      return Promise.resolve({ text: answer(prompt), model: `v${call}` });
    });
    const { service, saved } = setup({ model: 'v', generate });
    await service.run(options);

    const summary = await service.recategorize(['id1', 'id3'], {
      batchSize: 5,
      concurrency: 1,
    });

    expect(summary).toMatchObject({ requested: 2, categorized: 2 });
    expect(saved.get('id1')?.model).toBe('v2'); // reemplazado
    expect(saved.get('id0')?.model).toBe('v1'); // intacto
  });

  it('rechaza ids que no existen', () => {
    const { service } = setup({ model: 'm', generate: jest.fn() });
    expect(() =>
      service.recategorize(['no-existe'], { batchSize: 5, concurrency: 1 }),
    ).toThrow('no-existe');
  });
});
