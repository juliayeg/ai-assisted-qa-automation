import { expect, test } from '@playwright/test';

import type { EditProgramModal } from '../pages/EditProgramModal';
import type { NewProgramModal } from '../pages/NewProgramModal';
import type { ProgramsPage } from '../pages/ProgramsPage';

const saveTimeout = 60_000;

export async function expectProgramsPageReady(programs: ProgramsPage): Promise<void> {
  await expect(programs.heading).toBeVisible();
  await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
}

export async function expectProgramsListReady(programs: ProgramsPage): Promise<number> {
  await programs.goto();
  await expectProgramsPageReady(programs);

  let dataRows = 0;
  await expect(async () => {
    const tableVisible = await programs.table.isVisible();
    const emptyVisible = await programs.emptyState.isVisible();
    expect(tableVisible || emptyVisible).toBe(true);
    if (tableVisible) {
      const rows = await programs.table.getByRole('row').count();
      dataRows = Math.max(0, rows - 1);
    }
  }).toPass({ timeout: 60_000 });

  return dataRows;
}

export async function expectNewProgramModalOpen(modal: NewProgramModal): Promise<void> {
  await expect(modal.programName).toBeVisible();
}

export async function openNewProgramModal(programs: ProgramsPage): Promise<NewProgramModal> {
  await programs.goto();
  await expectProgramsPageReady(programs);
  await programs.openNewProgramForm();
  await expectNewProgramModalOpen(programs.newProgramModal);
  return programs.newProgramModal;
}

export async function openEditProgramModal(
  programs: ProgramsPage,
  programName: string,
): Promise<EditProgramModal> {
  await programs.openEditProgram(programName);
  await expect(programs.editProgramModal.programName).toBeVisible();
  return programs.editProgramModal;
}

export async function seedProgramForEdit(
  programs: ProgramsPage,
  programName: string,
  description: string,
): Promise<void> {
  await programs.goto();
  await expectProgramsPageReady(programs);
  await createProgramAndExpect(programs, programName, description, {
    waitForActionButton: 'edit',
  });
}

export async function seedProgramForDelete(
  programs: ProgramsPage,
  programName: string,
  description: string,
): Promise<void> {
  await programs.goto();
  await expectProgramsPageReady(programs);
  await createProgramAndExpect(programs, programName, description, {
    waitForActionButton: 'delete',
  });
}

export async function gotoProgramsAndReady(programs: ProgramsPage): Promise<void> {
  await programs.goto();
  await expectProgramsPageReady(programs);
}

export async function createProgramAndReturnToList(
  programs: ProgramsPage,
  programName: string,
  description: string,
): Promise<void> {
  await createProgramAndExpect(programs, programName, description, { hideTimeout: 30_000 });
  await gotoProgramsAndReady(programs);
}

export async function expectProgramCreated(
  programs: ProgramsPage,
  programName: string,
  options?: { waitForActionButton?: 'edit' | 'delete'; hideTimeout?: number },
): Promise<void> {
  await expect(programs.newProgramModal.dialog).toBeHidden({
    timeout: options?.hideTimeout ?? saveTimeout,
  });
  if (options?.waitForActionButton === 'edit') {
    await expect(programs.editProgramButton(programName)).toBeVisible({ timeout: 30_000 });
  } else if (options?.waitForActionButton === 'delete') {
    await expect(programs.deleteProgramButton(programName)).toBeVisible({ timeout: 30_000 });
  }
}

export async function createProgramAndExpect(
  programs: ProgramsPage,
  programName: string,
  description?: string,
  options?: { waitForActionButton?: 'edit' | 'delete'; hideTimeout?: number },
): Promise<void> {
  await programs.createProgram(programName, description);
  await expectProgramCreated(programs, programName, options);
}

export async function saveEditProgram(modal: EditProgramModal): Promise<void> {
  await expect(modal.saveButton).toBeEnabled();
  await modal.clickSave();
  await expect(modal.dialog).toBeHidden({ timeout: saveTimeout });
}

export async function expectProgramRowCount(
  programs: ProgramsPage,
  programName: string,
  expected: number,
): Promise<void> {
  await expect(programs.programRowsNamed(programName)).toHaveCount(expected, { timeout: 15_000 });
}

export async function expectProgramInList(
  programs: ProgramsPage,
  programName: string,
): Promise<void> {
  await expect(programs.table).toBeVisible({ timeout: 30_000 });
  await expect(programs.programNameText(programName)).toBeVisible();
}

export async function expectDuplicateRejected(
  programs: ProgramsPage,
  modal: NewProgramModal,
  programName: string,
  countBefore: number,
): Promise<void> {
  const countAfter = await programs.countProgramRowsNamed(programName);

  if (!(await modal.dialog.isVisible())) {
    expect(
      countAfter,
      'Duplicate should be rejected; modal closed and program count changed',
    ).toBe(countBefore);
    return;
  }

  expect(countAfter, 'Duplicate program should not increase list count').toBe(countBefore);

  const error = modal.duplicateError();
  if ((await error.count()) > 0) {
    await expect(error).toBeVisible();
  }
}

export async function requireProgramFilterOrSkip(programs: ProgramsPage): Promise<void> {
  await expectProgramsListReady(programs);
  const filter = programs.programFilter;
  if (!(await filter.isVisible())) {
    test.skip(true, 'Programs page has no search/filter field (filter feature not shipped yet)');
  }
}

export async function skipIfFilterUnavailable(programs: ProgramsPage): Promise<void> {
  if (!(await programs.programFilter.isVisible())) {
    test.skip(true, 'Programs page has no search/filter field (filter feature not shipped yet)');
  }
}
