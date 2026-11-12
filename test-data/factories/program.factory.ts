import { faker } from '@faker-js/faker';

import { uniqueSuffix } from '../../fixtures/test-data';

export type ProgramSeed = {
  name: string;
  description: string;
};

/** Happy-path program row for create/edit flows; always unique per test id. */
export function buildProgramSeed(
  testId: string,
  opts?: { discipline?: string; year?: number },
): ProgramSeed {
  const suffix = uniqueSuffix(testId);
  const discipline =
    opts?.discipline ??
    faker.helpers.arrayElement([
      'Web Development',
      'Data Science',
      'Cybersecurity Basics',
    ]);
  const year = opts?.year ?? faker.number.int({ min: 2025, max: 2030 });
  return {
    name: `${discipline} ${year} ${suffix}`,
    description: faker.lorem.sentence(),
  };
}
