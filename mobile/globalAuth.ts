// Simple in-memory global state for auth tokens to avoid AsyncStorage native module crashes
export let globalAuthToken: string | null = null;
export let globalUserRole: string | null = null;

export const setAuthToken = (token: string | null) => {
  globalAuthToken = token;
};

export const setUserRole = (role: string | null) => {
  globalUserRole = role;
};
