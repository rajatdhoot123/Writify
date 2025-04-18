import { createClient } from '@supabase/supabase-js';
import { chromeStorageKeys } from '@src/constant';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export async function signIn() {
  {
    /*
  // open a new tab to sign in with google directly without opening a tab
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  await chrome.runtime.sendMessage({
    action: 'signInWithGoogle',
    payload: { url: data.url }, // url is something like: https://[project_id].supabase.co/auth/v1/authorize?provider=google
  });
  */
  }

  // tell background service worker to create a new tab with that url
  await chrome.runtime.sendMessage({
    action: 'signUpWithWeb',
    payload: { url: `${import.meta.env.VITE_AUTH_HOST}/extension/login?source=extension` }, // url is something like: https://[project_id].supabase.co/auth/v1/authorize?provider=google
  });
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    await chrome.storage.sync.set({
      [chromeStorageKeys.gauthAccessToken]: '',
    });
    await chrome.storage.sync.set({
      [chromeStorageKeys.gauthRefreshToken]: '',
    });
  }
}

export async function getCurrentUser(): Promise<null | {
  user;
  accessToken: string;
}> {
  const gauthAccessToken = (await chrome.storage.sync.get(chromeStorageKeys.gauthAccessToken))[
    chromeStorageKeys.gauthAccessToken
  ];
  const gauthRefreshToken = (await chrome.storage.sync.get(chromeStorageKeys.gauthRefreshToken))[
    chromeStorageKeys.gauthRefreshToken
  ];

  if (gauthAccessToken && gauthRefreshToken) {
    try {
      // set user session from access_token and refresh_token
      const resp = await supabase.auth.setSession({
        access_token: gauthAccessToken,
        refresh_token: gauthRefreshToken,
      });

      const user = resp.data?.user;
      const supabaseAccessToken = resp.data.session?.access_token;

      if (user && supabaseAccessToken) {
        return { user, accessToken: supabaseAccessToken };
      }
    } catch (e) {
      console.error('Error: ', e);
    }
  }

  return null;
}
