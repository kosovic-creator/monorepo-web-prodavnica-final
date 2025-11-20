import { getServerSession } from 'next-auth';

import { getProizvodi } from '@actions/proizvodi';
import ProizvodiGridHomeClient from './ProizvodiGridHomeClient';
const { authOptions } = require('packages/auth/dist/auth/nextauth.config');


export default async function GridPage() {
  const session = (await getServerSession(authOptions)) as import("next-auth").Session | null;

  // Get products on server-side
  const result = await getProizvodi(1, 12);
  const proizvodi = result.success ? result.data?.proizvodi || [] : [];

  return <ProizvodiGridHomeClient initialProizvodi={proizvodi} session={session} />;
}
