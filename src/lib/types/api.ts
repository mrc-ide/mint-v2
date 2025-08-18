export interface ResponseBodyFailure {
	status: 'failure';
	data: null;
	errors: {
		error: string;
		detail: string | null;
	}[];
}
export interface ResponseBodySuccess {
	status: 'success';
	data: unknown;
	errors: null;
}
export type ResponseBody = ResponseBodySuccess | ResponseBodyFailure;
