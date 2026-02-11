import type { FieldErrors, FieldValues, ResolverOptions, ResolverResult } from "react-hook-form";
import type { ZodType, ZodError } from "zod";

/**
 * Local zodResolver implementation.
 * Replaces `@hookform/resolvers/zod` to avoid subpath import issues on Vercel.
 */

function toFieldErrors(
  zodError: ZodError,
  validateAllFieldCriteria: boolean
): FieldErrors {
  const errors: Record<string, any> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.map(String).join(".");
    if (!path) continue;

    if (!errors[path]) {
      errors[path] = { message: issue.message, type: issue.code };
    }

    if (validateAllFieldCriteria) {
      const types = errors[path].types || {};
      types[issue.code] = issue.message;
      errors[path].types = types;
    }
  }

  return errors;
}

export function zodResolver<T extends ZodType<any, any, any>>(schema: T) {
  return async (
    values: FieldValues,
    _context: any,
    options: ResolverOptions<FieldValues>
  ): Promise<ResolverResult<FieldValues>> => {
    try {
      const result = await schema.parseAsync(values);
      return { values: result, errors: {} };
    } catch (error: any) {
      if (error?.issues) {
        return {
          values: {},
          errors: toFieldErrors(error, options.criteriaMode === "all"),
        };
      }
      throw error;
    }
  };
}
