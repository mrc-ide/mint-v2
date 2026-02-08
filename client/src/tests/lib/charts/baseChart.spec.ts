import {
	configureHighcharts,
	createHighchart,
	getChartTheme,
	getColumnFill,
	setupAxisBreaks
} from '$lib/charts/baseChart';
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
		setOptions: vi.fn(),
		wrap: vi.fn(),
		Axis: {
			prototype: {
				getLinePath: vi.fn()
			}
		}
	}
}));
vi.mock('highcharts/esm/modules/accessibility', () => ({}));
vi.mock('highcharts/esm/modules/pattern-fill.js', () => ({}));
vi.mock('highcharts/esm/modules/exporting', () => ({}));
vi.mock('highcharts/esm/modules/broken-axis.js', () => ({}));

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
	it('should call Highcharts.setOptions & wrap', () => {
		configureHighcharts();
		expect(Highcharts.setOptions).toHaveBeenCalledTimes(1);
		expect(Highcharts.wrap).toHaveBeenCalledWith(Highcharts.Axis.prototype, 'getLinePath', expect.any(Function));
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

describe('setupAxisBreaks', () => {
	it('should return path unchanged when no breaks exist', () => {
		const axis = { horiz: true, min: 0, max: 100, toPixels: vi.fn() } as any;
		const brokenAxis = { hasBreaks: false, breakArray: [], axis };
		const path: [string, number, number][] = [
			['M', 10, 20],
			['L', 30, 40]
		];

		const result = setupAxisBreaks(axis, brokenAxis, path);

		expect(result).toEqual(path);
	});

	it('should skip breaks outside axis view', () => {
		const axis = { horiz: true, min: 50, max: 100, toPixels: vi.fn() } as any;
		const brokenAxis = {
			hasBreaks: true,
			breakArray: [{ from: 10, to: 20 }],
			axis
		};
		const path: [string, number, number][] = [['M', 10, 20]];

		const result = setupAxisBreaks(axis, brokenAxis, path);

		expect(result).toEqual(path);
	});

	it('should add slanted lines for horizontal axis breaks', () => {
		const axis = { horiz: true, min: 0, max: 100, toPixels: vi.fn().mockReturnValue(50) } as any;
		const brokenAxis = {
			hasBreaks: true,
			breakArray: [{ from: 30, to: 40 }],
			axis
		};
		const path: [string, number, number][] = [['M', 10, 20]];

		const result = setupAxisBreaks(axis, brokenAxis, path);

		expect(result.length).toBe(7); // original move + 6 new commands for the break
		expect(axis.toPixels).toHaveBeenCalledWith(40);
	});

	it('should add slanted lines for vertical axis breaks', () => {
		const axis = { horiz: false, min: 0, max: 100, toPixels: vi.fn().mockReturnValue(50) } as any;
		const brokenAxis = {
			hasBreaks: true,
			breakArray: [{ from: 30, to: 40 }],
			axis
		};
		const path: [string, number, number][] = [['M', 10, 20]];

		const result = setupAxisBreaks(axis, brokenAxis, path);

		expect(result.length).toBe(7); // original move + 6 new commands for the break
		expect(axis.toPixels).toHaveBeenCalledWith(40);
	});

	it('should handle multiple breaks', () => {
		const axis = { horiz: true, min: 0, max: 100, toPixels: vi.fn().mockReturnValue(50) } as any;
		const brokenAxis = {
			hasBreaks: true,
			breakArray: [
				{ from: 20, to: 30 },
				{ from: 60, to: 70 }
			],
			axis
		};
		const path: [string, number, number][] = [['M', 10, 20]];

		const result = setupAxisBreaks(axis, brokenAxis, path);

		expect(axis.toPixels).toHaveBeenCalledTimes(2);
		expect(result.length).toBeGreaterThan(1);
	});

	it('should handle undefined breakArray', () => {
		const axis = { horiz: true, min: 0, max: 100, toPixels: vi.fn() } as any;
		const brokenAxis = { hasBreaks: false, axis };
		const path: [string, number, number][] = [['M', 10, 20]];

		const result = setupAxisBreaks(axis, brokenAxis, path);

		expect(result).toEqual(path);
	});
});
