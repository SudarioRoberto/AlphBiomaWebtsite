// src/pages/api/linkedin/auth.js
import { getAuthorizationUrl } from '../../../lib/linkedin.js';

export async function get({ redirect }) {
    return new Response('LinkedIn auth route funcionando');
  }