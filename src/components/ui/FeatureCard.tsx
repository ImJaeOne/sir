import type { Feature } from '@/types/feature';

interface FeatureCardProps {
  feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      <span className="text-4xl">{feature.icon}</span>
      <h3 className="text-lg font-semibold text-slate-800">{feature.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
    </div>
  );
}
