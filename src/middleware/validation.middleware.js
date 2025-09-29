import { badRequest} from "@hapi/boom";

export const validateSchema = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return next(badRequest(error));
  }
  next();
};