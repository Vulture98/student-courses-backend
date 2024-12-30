import bcrypt from 'bcryptjs';

/**
 * Hash a plain password
 * @param {string} password - The plain password to hash.
 * @returns {Promise<string>} The hashed password.
 */
const generateHashPassword = async (password) => {
  const saltRounds = 10;  // You can adjust the salt rounds for security level
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

/**
 * Compare a plain password with a hashed password
 * @param {string} password - The plain password.
 * @param {string} hashedPassword - The hashed password to compare with.
 * @returns {Promise<boolean>} True if the passwords match, otherwise false.
 */
const comparePassword = async (password, hashedPassword) => {  
  return await bcrypt.compare(password, hashedPassword);
};

export { generateHashPassword, comparePassword };
