import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { env } from './env';

const basePath = PlaidEnvironments[env.PLAID_ENV] ?? PlaidEnvironments.sandbox;

const configuration = new Configuration({
  basePath,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID,
      'PLAID-SECRET': env.PLAID_SECRET,
    }
  }
})

export const plaidClient = new PlaidApi(configuration);
