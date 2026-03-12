'use client';

import { Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PipelineStages } from '@/components/pipeline/PipelineStages';

export default function PipelinePage() {
  return (
    <Suspense>
      <DashboardHeader />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6">
          <PipelineStages />
        </div>
      </div>
    </Suspense>
  );
}
