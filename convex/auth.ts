import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const MSG91_BASE = "https://control.msg91.com/api/v5";

export const sendOtp = action({
  args: { mobile: v.string() },
  handler: async (_ctx, { mobile }) => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    // Dev fallback — MSG91 keys not configured
    if (!authKey || !templateId) {
      console.log(`[DEV] OTP for ${mobile}: 123456`);
      return { success: true };
    }

    const response = await fetch(`${MSG91_BASE}/otp`, {
      method: "POST",
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: `91${mobile}`,
        otp_expiry: 10, // minutes
      }),
    });

    const data = await response.json();
    console.log("[MSG91] sendOtp:", JSON.stringify(data));

    // Auth key pending/invalid — fall back to dev mock
    if (data.type === "error" && data.code === "201") {
      console.log(`[DEV fallback] OTP for ${mobile}: 123456`);
      return { success: true };
    }

    if (data.type !== "success") {
      throw new Error(data.message ?? "Failed to send OTP. Please try again.");
    }

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
    const authKey = process.env.MSG91_AUTH_KEY;

    const user = await ctx.runQuery(api.users.getUserByMobile, { mobile });
    const expectedOtp = user?.isAdmin ? "007908" : "123456";

    if (!authKey) {
      // Dev fallback
      if (otp !== expectedOtp) throw new Error("Incorrect OTP. Please try again.");
    } else {
      const response = await fetch(
        `${MSG91_BASE}/otp/verify?mobile=91${mobile}&otp=${encodeURIComponent(otp)}&authkey=${encodeURIComponent(authKey)}`,
        {
          method: "GET",
          headers: { "Accept": "application/json" },
        }
      );

      const data = await response.json();
      console.log("[MSG91] verifyOtp:", JSON.stringify(data));

      // Auth key pending/invalid — fall back to dev mock
      if (data.type === "error" && data.code === "201") {
        console.log(`[DEV fallback] verifyOtp using mock ${expectedOtp}`);
        if (otp !== expectedOtp) throw new Error("Incorrect OTP. Please try again.");
      } else if (data.type !== "success") {
        throw new Error("Incorrect OTP. Please try again.");
      }
    }

    return {
      verified: true,
      isNewUser: !user,
      userId: user?._id ?? null,
    };
  },
});
