import Elysia from "elysia";

export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  ({ code, error, set }) => {
    console.error(`[Error] ${code}:`, error);

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        error: "ValidationError",
        message: error.message,
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: "NotFound",
        message: "The requested resource was not found.",
      };
    }

    if (code === "PARSE") {
      set.status = 400;
      return {
        success: false,
        error: "ParseError",
        message: "Invalid request body.",
      };
    }

    set.status = 500;
    return {
      success: false,
      error: "InternalServerError",
      message: "An unexpected error occurred.",
    };
  }
);
