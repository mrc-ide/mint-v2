const person = {
	greet: (name: string) => `Hello ${name}`
};

const spy = vi.spyOn(person, 'greet').mockImplementation(() => 'mocked');
describe('Mocking example', () => {
	it('test', () => {
		expect(person.greet('Alice')).toBe('mocked');
		expect(spy.mock.calls).toEqual([['Alice']]);

		// clear call history and reset implementation, but method is still spied
		spy.mockReset();
		expect(spy.mock.calls).toEqual([]);
		expect(person.greet).toBe(spy);
		expect(person.greet('Bob')).toBe('Hello Bob');
		expect(spy.mock.calls).toEqual([['Bob']]);
	});
});
