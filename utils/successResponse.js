import apiResponse from "./apiResponse.js";


const successResponse = (res, statusCode, data, message) => {
  return res.status(statusCode).json(apiResponse(true, statusCode, data, message, null));
};

export default successResponse
