import type { Categories, Meta } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';
import { createLabeler } from '@/lib/labels';
import { Badge } from '../ui/Badge';

interface ClientCategoriesProps {
  categories: Categories;
  meta: Meta;
}

/** Lista de todas las dimensiones que el LLM extrajo para un cliente. */
export function ClientCategories({ categories, meta }: ClientCategoriesProps) {
  const labels = createLabeler(meta);
  return (
    <div className="space-y-3">
      {categories.summary && (
        <p className="text-sm font-medium">{categories.summary}</p>
      )}
      <dl className="divide-border divide-y text-sm">
        <Row label="Consultas / mes">
          {formatNumber(categories.monthlyInquiries)}
        </Row>
        {meta.dimensions.map((dimension) => (
          <Row key={dimension.key} label={dimension.label}>
            <ValueBadges
              values={toList(categories[dimension.key])}
              labelOf={(value) => labels.value(dimension.key, value)}
            />
          </Row>
        ))}
      </dl>
    </div>
  );
}

const toList = (value: string | string[]) =>
  Array.isArray(value) ? value : [value];

function ValueBadges({
  values,
  labelOf,
}: {
  values: string[];
  labelOf: (value: string) => string;
}) {
  if (values.length === 0) return <span className="text-subtle">Ninguno</span>;

  return (
    <span className="flex flex-wrap justify-end gap-1">
      {values.map((value) => (
        <Badge key={value} tone="brand">
          {labelOf(value)}
        </Badge>
      ))}
    </span>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
