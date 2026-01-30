import { ApiError, apiFetch } from '$lib/fetch';
import type {
	CompareParameter,
	CompareParameters,
	CompareParametersWithValue,
	CompareParameterWithValue
} from '$lib/types/compare';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '../../routes/$types';
import { getCompareParametersUrl } from '$lib/url';
import type { FormValue } from '$lib/components/dynamic-region-form/types';

export const fetchCompareParameters = async (fetch: RequestEvent['fetch']): Promise<CompareParameters> => {
	try {
		const res = await apiFetch<CompareParameters>({ url: getCompareParametersUrl(), fetcher: fetch });
		return res.data;
	} catch (err) {
		const errorStatus = err instanceof ApiError ? err.status : 500;
		error(errorStatus, `Failed to fetch compare parameters`);
	}
};

export const getCompareParametersWithValue = (
	compareParameters: CompareParameters,
	formValues: Record<string, FormValue>
): CompareParametersWithValue => {
	const addValue = (param: CompareParameter): CompareParameterWithValue => {
		const value = formValues[param.parameterName];
		if (value === undefined || typeof value !== 'number') {
			throw new Error(`Value for parameter "${param.parameterName}" is missing or not a number.`);
		}
		return { ...param, value };
	};

	return {
		baselineParameters: compareParameters.baselineParameters.map(addValue),
		interventionParameters: compareParameters.interventionParameters.map(addValue)
	};
};
