import UploadProjectCsv from '$routes/_components/UploadProjectCsv.svelte';
import { uploadProjectSchema } from '$routes/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';

const csvTemplateUrl = vi.hoisted(() => '/mocked/csv/template');
vi.mock('$lib/url', () => ({
	csvTemplateUrl: vi.fn().mockReturnValue(csvTemplateUrl),
	regionUrl: vi.fn()
}));
const csvFile = (name: string) => new File(['Region\nNorth\n'], name, { type: 'text/csv' });

const openDialog = async () => {
	const screen = render(UploadProjectCsv, { pageForm: await superValidate(zod4(uploadProjectSchema)) } as any);
	await screen.getByRole('button', { name: /upload csv/i }).click();
	return screen;
};

describe('UploadProjectCsv component', () => {
	it('should open the dialog from the trigger', async () => {
		const screen = await openDialog();

		await expect.element(screen.getByText('Upload Project CSV')).toBeVisible();
		await expect.element(screen.getByLabelText(/project name/i)).toBeVisible();
		await expect.element(screen.getByLabelText(/csv file/i)).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Upload', exact: true })).toBeVisible();
	});

	it('should link to the CSV template as a download', async () => {
		const screen = await openDialog();

		const link = screen.getByRole('link', { name: /download the csv template/i });
		await expect.element(link).toBeVisible();
		await expect.element(link).toHaveAttribute('href', csvTemplateUrl);
		await expect.element(link).toHaveAttribute('download');
	});

	it('should only accept CSV files', async () => {
		const screen = await openDialog();

		await expect.element(screen.getByLabelText(/csv file/i)).toHaveAttribute('accept', '.csv,text/csv');
	});

	it('should suggest the file name as the project name', async () => {
		const screen = await openDialog();

		await userEvent.upload(screen.getByLabelText(/csv file/i), csvFile('Kenya 2026.csv'));

		await expect.element(screen.getByLabelText(/project name/i)).toHaveValue('Kenya 2026');
	});

	it('should keep the chosen file on the input, ready to submit', async () => {
		const screen = await openDialog();

		await userEvent.upload(screen.getByLabelText(/csv file/i), csvFile('Kenya 2026.csv'));

		const input = screen.getByLabelText(/csv file/i).element() as HTMLInputElement;
		expect(input.files?.length).toBe(1);
		expect(input.files?.item(0)?.name).toBe('Kenya 2026.csv');
	});

	it('should keep a project name that has already been typed', async () => {
		const screen = await openDialog();

		await userEvent.fill(screen.getByLabelText(/project name/i), 'My Project');
		await userEvent.upload(screen.getByLabelText(/csv file/i), csvFile('Kenya 2026.csv'));

		await expect.element(screen.getByLabelText(/project name/i)).toHaveValue('My Project');
	});
});
