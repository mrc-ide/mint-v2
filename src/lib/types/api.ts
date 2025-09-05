export interface ResponseBodyFailure {
	status: 'failure';
	data: null;
	errors: {
		error: string;
		detail: string | null;
	}[];
}
export interface ResponseBodySuccess<T> {
	status: 'success';
	data: T;
	errors: null;
}
export type ResponseBody<T> = ResponseBodySuccess<T> | ResponseBodyFailure | App.Error;
