

const apiResponse = (success, status, data = null, message = '', error = null) => {
  return {
    success, // success: status < 400,
    status,
    data,
    message,
    error
  };
};

export default apiResponse;
