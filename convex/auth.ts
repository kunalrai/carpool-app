import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// DEV: hardcoded OTPs — admin gets a separate OTP, everyone else uses the default.
// Step 11 will replace this with real MSG91 API calls.
const DEFAULT_OTP = "123456";
const ADMIN_OTP = "007908";

export const sendOtp = action({
  args: { mobile: v.string() },
  handler: async (ctx, { mobile }) => {
    const user = await ctx.runQuery(api.users.getUserByMobile, { mobile });
    const otp = user?.isAdmin ? ADMIN_OTP : DEFAULT_OTP;
    console.log(`[DEV] OTP for ${mobile}: ${otp}`);
    return { success: true };
  },
});

export const verifyOtp = action({
  args: { mobile: v.string(), otp: v.string() },
  handler: async (ctx, { mobile, otp }): Promise<{
    verified: boolean;
    isNewUser: boolean;
    userId: string | null;
  }> => {
    const user = await ctx.runQuery(api.users.getUserByMobile, { mobile });
    const expectedOtp = user?.isAdmin ? ADMIN_OTP : DEFAULT_OTP;

    if (otp !== expectedOtp) {
      throw new Error("Incorrect OTP. Please try again.");
    }

    return {
      verified: true,
      isNewUser: !user,
      userId: user?._id ?? null,
    };
  },
});
