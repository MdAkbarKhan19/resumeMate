import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth/server';
import config from '@/lib/amplify-config';

export const { runWithAmplifyServerContext } = createServerRunner({
  config,
});

export { fetchAuthSession, getCurrentUser };
