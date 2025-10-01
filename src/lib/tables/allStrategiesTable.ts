export interface AllStrategiesTableMetrics {
	percentageOfBudget: number;
	intervention: string;
	totalCasesAverted: number;
	totalCost: number;
}

const AllStrategiesTableInfo: Record<
	keyof AllStrategiesTableMetrics,
	{ label: string; formatStyle: 'string' | 'percent' | 'decimal' }
> = {
	percentageOfBudget: { label: '% of Max Budget', formatStyle: 'percent' },
	intervention: { label: 'Interventions', formatStyle: 'string' },
	totalCasesAverted: { label: 'Total cases averted', formatStyle: 'decimal' },
	totalCost: { label: 'Total cost (USD)', formatStyle: 'decimal' }
};
