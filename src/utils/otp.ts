const validOtps: Record<string, string> = {}; // phone -> otp

export const generateOtp = (phone: string) => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  validOtps[phone] = otp;
  return otp;
};

export const verifyOtp = (phone: string, otp: string) => {
  return validOtps[phone] === otp;
};