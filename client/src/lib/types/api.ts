export interface ResponseBodyFailure {
	detail: string;
}
export interface ResponseBodySuccess<T> {
	data: T;
}
export type ResponseBody<T> = ResponseBodySuccess<T> | ResponseBodyFailure | App.Error;
