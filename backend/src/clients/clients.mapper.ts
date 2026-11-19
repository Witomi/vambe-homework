import { Client } from '../domain/client';
import { ClientPrediction } from '../prediction/prediction.types';
import { ClientListItem } from './clients.types';

const EXCERPT_LENGTH = 160;

function excerpt(text: string): string {
  return text.length > EXCERPT_LENGTH
    ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…`
    : text;
}

/** Versión liviana del cliente para el listado (sin la transcripción completa). */
export function toListItem(
  { transcript, ...client }: Client,
  prediction: ClientPrediction | null,
): ClientListItem {
  return { ...client, prediction, excerpt: excerpt(transcript) };
}
