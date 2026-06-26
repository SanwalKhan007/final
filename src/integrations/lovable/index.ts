// Lovable dependency removed — all auth handled directly via Supabase
export const lovable = {
  auth: {
    signInWithOAuth: async (_provider: string, _opts?: { redirect_uri?: string }) => {
      return { redirected: false, error: new Error("Use supabase.auth.signInWithOAuth directly") };
    },
  },
};
