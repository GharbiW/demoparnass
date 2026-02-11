import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { ZodType, ZodError } from "zod";

/**
 * Local zodResolver implementation.
 * Replaces `@hookform/resolvers/zod` to avoid subpath import issues on Vercel.
 */

function toFieldErrors<T extends FieldValues>(zodError: ZodError): FieldErrors<T> {
  const errors: Record<string, any> = {};

  for (const issue of zodError.issues) {
    const path = issue.path;
    if (path.length === 0) continue;

    let current = errors;
    for (let i = 0; i < path.length; i++) {
      const key = String(path[i]);
      if (i === path.length - 1) {
        if (!current[key]) {
          current[key] = { message: issue.message, type: issue.code };
        }
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    }
  }

  return errors as FieldErrors<T>;
}

export function zodResolver<T extends FieldValues>(
  schema: ZodType<T, any, any>
): Resolver<T> {
  return async (values, _context, _options) => {
    try {
      const result = await schema.parseAsync(values);
      return { values: result as T, errors: {} as Record<string, never> };
    } catch (error: any) {
      if (error?.issues) {
        return {
          values: {} as Record<string, never>,
          errors: toFieldErrors<T>(error),
        };
      }
      throw error;
    }
  };
}
