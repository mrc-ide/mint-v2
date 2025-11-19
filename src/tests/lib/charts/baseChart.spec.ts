import { configureHighcharts, createHighchart, getChartTheme, getColumnFill } from '$lib/charts/baseChart';
import type { Scenario } from '$lib/types/userState';
import Highcharts from 'highcharts/esm/highcharts.js';

import { mode } from 'mode-watcher';

vi.mock('mode-watcher', () => ({
	mode: {
		current: 'light'
	}
}));

vi.mock('highcharts/esm/highcharts.js', () => ({
	default: {
		chart: vi.fn(),
		setOptions: vi.fn()
	}
}));
vi.mock('highcharts/esm/modules/accessibility', () => ({}));
vi.mock('highcharts/esm/modules/pattern-fill.js', () => ({}));
vi.mock('highcharts/esm/modules/exporting', () => ({}));

beforeEach(() => {
	vi.resetAllMocks();
});

describe('getChartTheme', () => {
	it('should return light theme for light mode', () => {
		(mode as any).current = 'light';
		expect(getChartTheme()).toBe('highcharts-light');
	});

	it('should return dark theme for dark mode', () => {
		(mode as any).current = 'dark';
		expect(getChartTheme()).toBe('highcharts-dark');
	});
});

describe('getColumnFill', () => {
	it('should return pattern object with color and dimensions', () => {
		const result = getColumnFill('no_intervention' as Scenario);
		expect(result.pattern.color).toBe('var(--muted-foreground)');
		expect(result.pattern.width).toBe(10);
		expect(result.pattern.height).toBe(10);
	});

	it('should include path for LSM scenarios', () => {
		const result = getColumnFill('py_only_with_lsm' as Scenario) as any;
		expect(result.pattern).toHaveProperty('path');
		expect(result.pattern.path.d).toBe('M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11');
	});

	it('should not include path for non-LSM scenarios', () => {
		const result = getColumnFill('py_only_only' as Scenario);
		expect(result.pattern).not.toHaveProperty('path');
	});

	it('should handle all LSM scenarios consistently', () => {
		const lsmScenarios: Scenario[] = ['py_only_with_lsm', 'py_pbo_with_lsm', 'py_pyrrole_with_lsm', 'py_ppf_with_lsm'];
		lsmScenarios.forEach((scenario) => {
			const result = getColumnFill(scenario);
			expect(result.pattern).toHaveProperty('path');
		});
	});
});

describe('configureHighcharts', () => {
	it('should call Highcharts.setOptions', () => {
		configureHighcharts();
		expect(Highcharts.setOptions).toHaveBeenCalledTimes(1);
	});
});

describe('createHighchart', () => {
	it('should return an attachment function', () => {
		const config: Highcharts.Options = {};
		const attachment = createHighchart(config);
		expect(typeof attachment).toBe('function');
	});

	it('should create chart with provided config', () => {
		const config: Highcharts.Options = { title: { text: 'Test' } };
		const element = 'element';
		const attachment = createHighchart(config);

		attachment(element as any);

		expect(Highcharts.chart).toHaveBeenCalledWith(element, config);
	});

	it('should call onLoad callback if provided', () => {
		const onLoad = vi.fn();
		const element = 'hello';
		const attachment = createHighchart({}, onLoad);

		attachment(element as any);

		expect(onLoad).toHaveBeenCalledTimes(1);
	});

	it('should return cleanup function that destroys chart', () => {
		const mockDestroy = vi.fn();
		vi.mocked(Highcharts.chart).mockReturnValue({ destroy: mockDestroy } as any);

		const element = 'hello';
		const attachment = createHighchart({});
		const cleanup = attachment(element as any) as () => void;

		cleanup();

		expect(mockDestroy).toHaveBeenCalledTimes(1);
	});
});
