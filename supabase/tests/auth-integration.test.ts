import { createClient } from '../../lib/supabase/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Authentication System', () => {
  const supabase = createClient();
  const testEmail = `testuser+${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    // Clean up any existing test user
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (existingUser) {
      await supabase.auth.admin.deleteUser(existingUser.id);
    }
  });

  describe('Basic Authentication Flow', () => {
    it('should allow user registration', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      expect(error).toBeNull();
      expect(data.user?.email).toBe(testEmail);
      expect(data.session).toBeDefined();
    });

    it('should allow user login', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      expect(error).toBeNull();
      expect(data.user?.email).toBe(testEmail);
      expect(data.session).toBeDefined();
    });

    it('should persist session across page reloads', async () => {
      // Initial login
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      // Simulate page reload by creating new client
      const newClient = createClient();
      const { data } = await newClient.auth.getSession();

      expect(data.session).toBeDefined();
      expect(data.session?.user.email).toBe(testEmail);
    });

    it('should allow user logout', async () => {
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      const { error } = await supabase.auth.signOut();
      expect(error).toBeNull();

      const { data } = await supabase.auth.getSession();
      expect(data.session).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should automatically refresh access token', async () => {
      // Login first
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      // Get initial session
      const { data: initialSession } = await supabase.auth.getSession();
      const initialAccessToken = initialSession.session?.access_token;

      // Wait for token to expire (simulate by setting short expiry)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Make authenticated request to trigger token refresh
      const { data: refreshedSession } = await supabase.auth.getSession();
      const refreshedAccessToken = refreshedSession.session?.access_token;

      expect(refreshedAccessToken).toBeDefined();
      expect(refreshedAccessToken).not.toBe(initialAccessToken);
    });

    it('should handle session timeout', async () => {
      // Login first
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      // Simulate session timeout by manually expiring the token
      await supabase.auth.admin.updateUserById(
        (await supabase.auth.getUser()).data.user?.id || '',
        { password: testPassword },
      );

      // Verify session is invalid
      const { data: session } = await supabase.auth.getSession();
      expect(session.session).toBeNull();
    });
  });

  afterAll(async () => {
    // Clean up test user
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await supabase.auth.admin.deleteUser(user.user.id);
    }
  });
});
