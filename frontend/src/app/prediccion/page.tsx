import { FactorsList } from '@/components/prediction/FactorsList';
import { GradesTable } from '@/components/prediction/GradesTable';
import { ProbabilityDistribution } from '@/components/prediction/ProbabilityDistribution';
import { CoverageNote, PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

/**
 * Predicción: probabilidad de cierre estimada con regresión logística
 * sobre lo que el LLM extrajo de cada reunión.
 */
export default async function PredictionPage() {
  const [meta, prediction] = await Promise.all([api.meta(), api.prediction()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predicción de cierre"
        description="Un modelo (regresión logística) estima la probabilidad de que cada cliente compre según lo que contó en la reunión. Aquí se ve qué tan bien funciona."
        aside={<CoverageNote meta={meta} />}
      />
      <GradesTable grades={prediction.grades} />
      <ProbabilityDistribution
        buckets={prediction.buckets}
        grades={prediction.grades}
        baseRate={prediction.quality.baseRate}
      />
      <FactorsList factors={prediction.factors} />
    </div>
  );
}
