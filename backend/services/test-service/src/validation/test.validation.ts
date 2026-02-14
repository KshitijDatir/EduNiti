import { z } from 'zod';

/**
 * Validate the :testId route parameter.
 * Accepts UUID format.
 */
export const testIdSchema = z.object({
    testId: z.string().uuid('Invalid test ID format'),
});

export type TestIdParams = z.infer<typeof testIdSchema>;
