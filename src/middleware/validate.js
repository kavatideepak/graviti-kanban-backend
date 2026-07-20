import { ZodError } from 'zod';

// validate({ body, params, query }) — replaces req.* with parsed values on success.
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
      }
      next(err);
    }
  };
}
