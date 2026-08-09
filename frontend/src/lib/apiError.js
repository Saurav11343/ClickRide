export const getApiErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (Array.isArray(error?.response?.data?.details)
    ? error.response.data.details.join(", ")
    : null) ||
  fallback;
