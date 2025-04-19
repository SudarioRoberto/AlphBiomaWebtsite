// src/utils/refreshLinkedInToken.js
// This utility function handles refreshing the LinkedIn access token

import { createClient } from '@supabase/supabase-js';

// LinkedIn OAuth credentials from environment variables
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// Supabase connection (optional)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

/**
 * Refreshes the LinkedIn access token
 * @param {string} refreshToken - The refresh token to use
 * @param {string} userId - The LinkedIn user ID
 * @returns {Promise<object>} - The new token data
 */
export async function refreshLinkedInToken(refreshToken, userId) {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();

    // Store the new tokens if using Supabase
    if (supabase && userId) {
      await supabase
        .from('linkedin_tokens')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token, // LinkedIn provides a new refresh token
          expires_in: tokenData.expires_in,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    // Return the new token data
    return tokenData;
  } catch (error) {
    console.error('Error refreshing LinkedIn token:', error);
    throw error;
  }
}

/**
 * Checks if a token needs refreshing and refreshes it if necessary
 * This can be called before making any LinkedIn API request
 * @param {string} userId - The LinkedIn user ID
 * @returns {Promise<string>} - The valid access token
 */
export async function getValidAccessToken(userId) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Get the current token from the database
  const { data, error } = await supabase
    .from('linkedin_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Token not found for this user');
  }

  // Check if the token is expired or about to expire (within 5 minutes)
  const createdAt = new Date(data.created_at);
  const expiresAt = new Date(createdAt.getTime() + (data.expires_in * 1000));
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  // If the token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
    console.log('LinkedIn token is about to expire, refreshing...');
    const newTokenData = await refreshLinkedInToken(data.refresh_token, userId);
    return newTokenData.access_token;
  }

  // Return the current valid token
  return data.access_token;
}