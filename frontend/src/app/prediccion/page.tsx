import { CalibrationChart } from '@/components/prediction/CalibrationChart';
import { FactorsList } from '@/components/prediction/FactorsList';
import { GradesTable } from '@/components/prediction/GradesTable';
import { ModelQuality } from '@/components/prediction/ModelQuality';
import { ProbabilityDistribution } from '@/components/prediction/ProbabilityDistribution';
import { RegressionCurve } from '@/components/prediction/RegressionCurve';
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
      <ModelQuality quality={prediction.quality} />
      <GradesTable grades={prediction.grades} />
      <RegressionCurve
        points={prediction.points}
        thresholds={prediction.gradeThresholds}
      />
      <ProbabilityDistribution
        buckets={prediction.buckets}
        baseRate={prediction.quality.baseRate}
      />
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <CalibrationChart buckets={prediction.buckets} />
        <FactorsList factors={prediction.factors} />
      </div>
    </div>
  );
}
